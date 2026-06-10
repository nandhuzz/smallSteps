export namespace database {
	
	export class DailyChecklist {
	    id: number;
	    date: string;
	    market_analysis: boolean;
	    risk_assessment: boolean;
	    trading_plan: boolean;
	    mental_state: boolean;
	    capital_check: boolean;
	    news_review: boolean;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new DailyChecklist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = source["date"];
	        this.market_analysis = source["market_analysis"];
	        this.risk_assessment = source["risk_assessment"];
	        this.trading_plan = source["trading_plan"];
	        this.mental_state = source["mental_state"];
	        this.capital_check = source["capital_check"];
	        this.news_review = source["news_review"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Goal {
	    id: number;
	    title: string;
	    target_amount: number;
	    current_amount: number;
	    deadline?: string;
	    status: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Goal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.target_amount = source["target_amount"];
	        this.current_amount = source["current_amount"];
	        this.deadline = source["deadline"];
	        this.status = source["status"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Task {
	    id: number;
	    title: string;
	    description: string;
	    priority: string;
	    status: string;
	    due_date?: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    completed_at?: any;
	
	    static createFrom(source: any = {}) {
	        return new Task(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.priority = source["priority"];
	        this.status = source["status"];
	        this.due_date = source["due_date"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.completed_at = this.convertValues(source["completed_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Trade {
	    id: number;
	    // Go type: time
	    date: any;
	    symbol: string;
	    trade_type: string;
	    instrument_type?: string;
	    option_type?: string;
	    strike_price?: number;
	    expiry_date?: string;
	    quantity: number;
	    entry_price: number;
	    exit_price?: number;
	    profit_loss?: number;
	    brokerage: number;
	    other_charges: number;
	    status: string;
	    notes: string;
	    emotion_before: string;
	    emotion_after: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Trade(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = this.convertValues(source["date"], null);
	        this.symbol = source["symbol"];
	        this.trade_type = source["trade_type"];
	        this.instrument_type = source["instrument_type"];
	        this.option_type = source["option_type"];
	        this.strike_price = source["strike_price"];
	        this.expiry_date = source["expiry_date"];
	        this.quantity = source["quantity"];
	        this.entry_price = source["entry_price"];
	        this.exit_price = source["exit_price"];
	        this.profit_loss = source["profit_loss"];
	        this.brokerage = source["brokerage"];
	        this.other_charges = source["other_charges"];
	        this.status = source["status"];
	        this.notes = source["notes"];
	        this.emotion_before = source["emotion_before"];
	        this.emotion_after = source["emotion_after"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TradingSettings {
	    id: number;
	    max_trades_per_day: number;
	    max_loss_per_day: number;
	    max_loss_per_trade: number;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new TradingSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.max_trades_per_day = source["max_trades_per_day"];
	        this.max_loss_per_day = source["max_loss_per_day"];
	        this.max_loss_per_trade = source["max_loss_per_trade"];
	        this.updated_at = this.convertValues(source["updated_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WeeklyChecklist {
	    id: number;
	    week_start: string;
	    performance_review: boolean;
	    strategy_analysis: boolean;
	    goal_progress: boolean;
	    learning_notes: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new WeeklyChecklist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.week_start = source["week_start"];
	        this.performance_review = source["performance_review"];
	        this.strategy_analysis = source["strategy_analysis"];
	        this.goal_progress = source["goal_progress"];
	        this.learning_notes = source["learning_notes"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class NewsArticle {
	    title: string;
	    description: string;
	    url: string;
	    publishedAt: string;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new NewsArticle(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.description = source["description"];
	        this.url = source["url"];
	        this.publishedAt = source["publishedAt"];
	        this.source = source["source"];
	    }
	}

}

