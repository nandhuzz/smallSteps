# Trade Edit Feature Enhancement

## Overview
Enhanced the trade editing feature in the Trade History component to provide comprehensive editing capabilities for all trade fields including options trading parameters, exit prices, and automatic P&L recalculation.

## Changes Made

### 1. Enhanced Edit Modal (TradeHistory.tsx)
- **Added Instrument Type Selection**: Users can now switch between EQUITY and OPTIONS when editing
- **Options Trading Fields**:
  - Option Type (CALL/PUT) radio buttons
  - Strike Price input field
  - Expiry Date picker
- **Exit Price Editing**: Added exit price field for CLOSED trades with automatic P&L recalculation
- **Emotion Fields**:
  - Emotion Before Trade dropdown
  - Emotion After Trade dropdown (for closed trades only)
- **Improved Layout**: Added scrollable modal with better organization of fields
- **Better Validation**: Enhanced validation for options-specific fields and closed trade requirements

### 2. Improved Edit Button Visibility
- **Previous Behavior**: Edit button only shown for OPEN trades
- **New Behavior**: Edit button now available for ALL trades (both OPEN and CLOSED)
- **Rationale**: Users should be able to correct data entry errors even after closing a trade

### 3. Automatic P&L Recalculation
- **New Feature**: When editing a closed trade's exit price, the P&L is automatically recalculated
- **Backend Function**: New `UpdateClosedTrade` function handles the recalculation
- **Formula**: P&L = (Exit - Entry) × Quantity - (Brokerage + Other Charges) for BUY trades
- **Formula**: P&L = (Entry - Exit) × Quantity - (Brokerage + Other Charges) for SELL trades

### 4. Enhanced Validation
- Added validation for options trading:
  - Strike price must be greater than 0 for options
  - Expiry date is required for options
- Added validation for closed trades:
  - Exit price must be greater than 0 for closed trades
- Symbol is automatically converted to uppercase
- Conditional field submission based on instrument type and trade status

### 5. Import Fix
- Added `Fragment` import from preact to fix JSX fragment TypeScript error

## Features

### Edit Modal Fields
1. **Instrument Type** (Radio buttons: EQUITY/OPTIONS)
2. **Symbol** (Text input, auto-uppercase)
3. **Option Type** (Radio buttons: CALL/PUT) - Only for OPTIONS
4. **Strike Price** (Number input) - Only for OPTIONS
5. **Expiry Date** (Date picker) - Only for OPTIONS
6. **Trade Type** (Dropdown: BUY/SELL)
7. **Quantity** (Number input)
8. **Entry Price** (Number input with decimal support)
9. **Exit Price** (Number input with decimal support) - **Only for CLOSED trades**
10. **Brokerage** (Number input with decimal support)
11. **Other Charges** (Number input with decimal support)
12. **Emotion Before Trade** (Dropdown: Calm, Anxious, Confident, Fearful, Greedy)
13. **Emotion After Trade** (Dropdown: Calm, Anxious, Confident, Fearful, Greedy, Relieved, Disappointed, Frustrated) - **Only for CLOSED trades**
14. **Notes** (Textarea with placeholder)

### User Experience Improvements
- Modal is scrollable for better mobile/small screen support
- Conditional rendering of options fields based on instrument type
- Clear visual separation between field groups
- Consistent styling with the rest of the application
- Proper validation messages for required fields

## Backend Support

### UpdateTrade Function (app.go)
For OPEN trades:
- Handles both EQUITY and OPTIONS instrument types
- Properly manages optional fields (option_type, strike_price, expiry_date)
- Updates all trade parameters in the database

### UpdateClosedTrade Function (app.go & database/services.go)
**NEW**: For CLOSED trades with exit price editing:
- Accepts all trade parameters including exit price and emotion after
- **Automatically recalculates P&L** based on:
  - Trade type (BUY/SELL)
  - Entry and exit prices
  - Quantity
  - Brokerage and other charges
- Updates the database with new values and recalculated P&L
- Logs the update with the new P&L value

## Usage
1. Navigate to Trade History
2. Find the trade you want to edit
3. Click the "✏️ Edit" button
4. Modify the desired fields in the modal
5. Click "Update Trade" to save changes
6. Click "Cancel" to discard changes

## Technical Details
- Component: `frontend/src/components/Trading/TradeHistory.tsx`
- Backend Method: `UpdateTrade` in `app.go`
- Database: Uses existing `trades` table with all necessary columns
- Validation: Client-side validation before API call

## Testing Recommendations
1. Test editing EQUITY trades (both open and closed)
2. Test editing OPTIONS trades with all option fields
3. Test switching instrument type during edit
4. Test validation for required fields
5. **Test editing exit price on CLOSED trades and verify P&L recalculation**
6. **Test that exit price field only appears for CLOSED trades**
7. **Test that emotion after field only appears for CLOSED trades**
8. Test with various emotion states
9. Test with decimal values in price fields
10. **Test P&L calculation for both BUY and SELL trades**
11. **Test that brokerage and charges are properly deducted from P&L**

## Key Benefits
✅ **Correct Data Entry Errors**: Edit any trade field even after closing
✅ **Automatic P&L Recalculation**: No manual calculation needed when adjusting exit prices
✅ **Comprehensive Editing**: All trade parameters can be modified
✅ **Smart UI**: Fields appear/hide based on trade status and instrument type
✅ **Data Integrity**: Proper validation ensures data quality
✅ **Audit Trail**: All updates are logged in the system

## Future Enhancements (Optional)
- Add date/time editing capability
- Add bulk edit functionality
- Add edit history/audit trail with before/after values
- Add undo/redo functionality
- Add keyboard shortcuts for quick editing
- Add visual indicator showing P&L change when editing exit price
- Add confirmation dialog when making significant P&L changes