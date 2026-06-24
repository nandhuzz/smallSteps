# 🚀 Advanced Analytics - Setup Commands

## Quick Start Guide

Follow these steps to complete the setup and start using the advanced analytics features.

---

## Step 1: Generate Wails Bindings

This creates TypeScript bindings for the new Go API methods.

```bash
wails generate
```

**Expected Output**:
```
Generating bindings...
✓ Generated frontend/wailsjs/go/main/App.js
✓ Generated frontend/wailsjs/go/main/App.d.ts
✓ Generated frontend/wailsjs/go/models.ts
Done!
```

**What this does**:
- Creates TypeScript definitions for all Go methods
- Generates JavaScript bindings for frontend-backend communication
- Updates type definitions for type safety

---

## Step 2: Run in Development Mode

Test the application with hot reload enabled.

```bash
wails dev
```

**Expected Output**:
```
Building frontend...
Building application...
Starting application...
✓ Application started successfully
```

**Access the app**:
- The application window will open automatically
- Navigate to the Dashboard to see the new Advanced Analytics section

---

## Step 3: Build for Production (Optional)

Create a production build when ready to deploy.

```bash
wails build
```

**Expected Output**:
```
Building frontend...
Building application...
✓ Build complete: ./build/bin/smallSteps.exe
```

**Output Location**:
- Windows: `build/bin/smallSteps.exe`
- macOS: `build/bin/smallSteps.app`
- Linux: `build/bin/smallSteps`

---

## Optional: Add Database Indexes

For better query performance, add these indexes to your SQLite database.

### Option A: Create Migration File

Create `database/migrations/000007_add_analytics_indexes.up.sql`:

```sql
-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_profit_loss ON trades(profit_loss);
CREATE INDEX IF NOT EXISTS idx_trades_emotion_before ON trades(emotion_before);
CREATE INDEX IF NOT EXISTS idx_trades_notes ON trades(notes);
CREATE INDEX IF NOT EXISTS idx_trades_date_status ON trades(date, status);
```

Create `database/migrations/000007_add_analytics_indexes.down.sql`:

```sql
-- Remove analytics indexes
DROP INDEX IF EXISTS idx_trades_date;
DROP INDEX IF EXISTS idx_trades_status;
DROP INDEX IF EXISTS idx_trades_profit_loss;
DROP INDEX IF EXISTS idx_trades_emotion_before;
DROP INDEX IF EXISTS idx_trades_notes;
DROP INDEX IF EXISTS idx_trades_date_status;
```

Then run the application - migrations will apply automatically.

### Option B: Manual SQL Execution

Open your SQLite database and run:

```sql
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_profit_loss ON trades(profit_loss);
CREATE INDEX IF NOT EXISTS idx_trades_emotion_before ON trades(emotion_before);
CREATE INDEX IF NOT EXISTS idx_trades_notes ON trades(notes);
CREATE INDEX IF NOT EXISTS idx_trades_date_status ON trades(date, status);
```

**Database Location**:
- Windows: `C:\Users\<YourUsername>\.smallsteps\trading-test.db`
- macOS/Linux: `~/.smallsteps/trading-test.db`

---

## Troubleshooting

### Issue: "wails: command not found"

**Solution**: Install Wails CLI
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Issue: TypeScript errors persist after `wails generate`

**Solution**: Restart your IDE/editor
- VS Code: Reload window (Ctrl+Shift+P → "Reload Window")
- Or close and reopen the project

### Issue: Frontend build fails

**Solution**: Clean and reinstall dependencies
```bash
cd frontend
npm install
cd ..
wails dev
```

### Issue: Database locked error

**Solution**: Close the application and try again
- Ensure no other instances are running
- Check Task Manager (Windows) or Activity Monitor (macOS)

### Issue: Charts not rendering

**Solution**: Check browser console
- Open DevTools (F12)
- Look for JavaScript errors
- Verify data is being fetched correctly

---

## Verification Checklist

After running `wails dev`, verify:

- [ ] Application starts without errors
- [ ] Dashboard loads successfully
- [ ] Advanced Analytics section appears below existing dashboard
- [ ] KPI cards display with values (if you have trades)
- [ ] Charts render correctly
- [ ] Date filter buttons work
- [ ] Performance summary table shows data
- [ ] No console errors in DevTools

---

## Testing with Sample Data

If you don't have trades yet, you can add sample data:

### Add Sample Trades via UI
1. Go to Trading → Trade Entry
2. Add a few sample trades with different:
   - Profit/Loss values
   - Emotions (Calm, Confident, Greedy, Fearful)
   - Notes (include keywords like "mobile", "trial", "revenge")
3. Close some trades with exit prices
4. Return to Dashboard to see analytics

### Or Use SQL (Advanced)
```sql
INSERT INTO trades (date, symbol, trade_type, quantity, entry_price, exit_price, 
                    profit_loss, brokerage, other_charges, status, notes, 
                    emotion_before, emotion_after, created_at)
VALUES 
  (date('now'), 'NIFTY', 'BUY', 50, 19500, 19600, 4950, 25, 25, 'CLOSED', 
   'Good setup', 'Calm', 'Confident', datetime('now')),
  (date('now'), 'BANKNIFTY', 'SELL', 25, 44500, 44400, 2475, 25, 25, 'CLOSED', 
   'Perfect entry', 'Confident', 'Happy', datetime('now')),
  (date('now'), 'NIFTY', 'BUY', 50, 19500, 19450, -2550, 25, 25, 'CLOSED', 
   'mobile trade - mistake', 'Greedy', 'Regret', datetime('now'));
```

---

## Performance Tips

### For Large Datasets (1000+ trades)

1. **Enable Indexes** (see above)
2. **Adjust Query Limits**:
   - Modify trend queries to fetch fewer months
   - Use pagination for large result sets

3. **Implement Caching** (Future Enhancement):
   ```go
   // In app.go, add simple caching
   var analyticsCache map[string]interface{}
   var cacheTime time.Time
   
   func (a *App) GetAdvancedAnalytics(startDate, endDate string) {
       // Check cache (5 min expiry)
       if time.Since(cacheTime) < 5*time.Minute {
           return analyticsCache, nil
       }
       // Fetch fresh data...
   }
   ```

---

## Next Steps After Setup

1. **Explore the Analytics**:
   - Review your KPI metrics
   - Analyze emotional patterns
   - Identify recurring mistakes
   - Compare mobile vs desktop performance

2. **Set Goals Based on Insights**:
   - Improve risk:reward ratio to >1.5
   - Increase profit factor to >2.0
   - Reduce mobile trading
   - Eliminate identified mistakes

3. **Track Progress**:
   - Use monthly trends to see improvement
   - Monitor expectancy over time
   - Adjust trading strategy based on data

4. **Customize Further** (Optional):
   - Add more mistake keywords in `GetMistakeAnalysis()`
   - Adjust color thresholds in frontend
   - Add custom date ranges
   - Export reports (future feature)

---

## Support & Resources

### Documentation
- `ADVANCED_ANALYTICS_PLAN.md` - Complete specifications
- `ANALYTICS_ARCHITECTURE.md` - System design
- `ANALYTICS_QUICK_START.md` - Code examples
- `ANALYTICS_IMPLEMENTATION_STATUS.md` - Current status

### Code Locations
- **Backend**: `database/services.go`, `app.go`
- **Frontend**: `frontend/src/components/Dashboard/AdvancedAnalytics.tsx`
- **Styles**: `frontend/src/components/Dashboard/AdvancedAnalytics.css`

### Wails Documentation
- Official Docs: https://wails.io/docs/introduction
- API Reference: https://wails.io/docs/reference/runtime/intro
- Community: https://github.com/wailsapp/wails/discussions

---

## Summary

**Minimum Required Steps**:
```bash
# 1. Generate bindings
wails generate

# 2. Run application
wails dev

# 3. Test in browser/app window
# Navigate to Dashboard → Advanced Analytics section
```

**Recommended Steps**:
```bash
# 1. Generate bindings
wails generate

# 2. Add database indexes (optional but recommended)
# See "Optional: Add Database Indexes" section above

# 3. Run application
wails dev

# 4. Add sample trades if needed

# 5. Verify all features work

# 6. Build for production (when ready)
wails build
```

---

**Status**: ✅ Ready to Run!

Execute `wails generate` followed by `wails dev` to start using the advanced analytics features.

---

**Last Updated**: 2026-06-22  
**Version**: 1.0