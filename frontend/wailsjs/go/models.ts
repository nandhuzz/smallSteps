export namespace broker {
	
	export class MarketQuote {
	    trading_symbol: string;
	    last_price: number;
	    "ohlc.open": number;
	    "ohlc.high": number;
	    "ohlc.low": number;
	    "ohlc.close": number;
	    volume: number;
	    net_change: number;
	    change_percent: number;
	    // Go type: time
	    last_trade_time: any;
	
	    static createFrom(source: any = {}) {
	        return new MarketQuote(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.trading_symbol = source["trading_symbol"];
	        this.last_price = source["last_price"];
	        this["ohlc.open"] = source["ohlc.open"];
	        this["ohlc.high"] = source["ohlc.high"];
	        this["ohlc.low"] = source["ohlc.low"];
	        this["ohlc.close"] = source["ohlc.close"];
	        this.volume = source["volume"];
	        this.net_change = source["net_change"];
	        this.change_percent = source["change_percent"];
	        this.last_trade_time = this.convertValues(source["last_trade_time"], null);
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
	export class Position {
	    trading_symbol: string;
	    exchange: string;
	    quantity: number;
	    average_price: number;
	    last_price: number;
	    pnl: number;
	    day_change: number;
	    day_change_percentage: number;
	
	    static createFrom(source: any = {}) {
	        return new Position(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.trading_symbol = source["trading_symbol"];
	        this.exchange = source["exchange"];
	        this.quantity = source["quantity"];
	        this.average_price = source["average_price"];
	        this.last_price = source["last_price"];
	        this.pnl = source["pnl"];
	        this.day_change = source["day_change"];
	        this.day_change_percentage = source["day_change_percentage"];
	    }
	}
	export class Trade {
	    order_id: string;
	    trading_symbol: string;
	    exchange: string;
	    transaction_type: string;
	    quantity: number;
	    average_price: number;
	    order_type: string;
	    status: string;
	    // Go type: time
	    order_timestamp: any;
	    product: string;
	
	    static createFrom(source: any = {}) {
	        return new Trade(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.order_id = source["order_id"];
	        this.trading_symbol = source["trading_symbol"];
	        this.exchange = source["exchange"];
	        this.transaction_type = source["transaction_type"];
	        this.quantity = source["quantity"];
	        this.average_price = source["average_price"];
	        this.order_type = source["order_type"];
	        this.status = source["status"];
	        this.order_timestamp = this.convertValues(source["order_timestamp"], null);
	        this.product = source["product"];
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
	export class UserProfile {
	    user_id: string;
	    user_name: string;
	    email: string;
	    user_type: string;
	    broker: string;
	    products: string[];
	    exchanges: string[];
	
	    static createFrom(source: any = {}) {
	        return new UserProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user_id = source["user_id"];
	        this.user_name = source["user_name"];
	        this.email = source["email"];
	        this.user_type = source["user_type"];
	        this.broker = source["broker"];
	        this.products = source["products"];
	        this.exchanges = source["exchanges"];
	    }
	}

}

export namespace database {
	
	export class BrokerConfig {
	    id: number;
	    broker_name: string;
	    api_key: string;
	    api_secret: string;
	    access_token: string;
	    refresh_token: string;
	    // Go type: time
	    token_expiry?: any;
	    is_active: boolean;
	    auto_sync_trades: boolean;
	    auto_sync_positions: boolean;
	    sync_interval: number;
	    // Go type: time
	    last_sync?: any;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new BrokerConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.broker_name = source["broker_name"];
	        this.api_key = source["api_key"];
	        this.api_secret = source["api_secret"];
	        this.access_token = source["access_token"];
	        this.refresh_token = source["refresh_token"];
	        this.token_expiry = this.convertValues(source["token_expiry"], null);
	        this.is_active = source["is_active"];
	        this.auto_sync_trades = source["auto_sync_trades"];
	        this.auto_sync_positions = source["auto_sync_positions"];
	        this.sync_interval = source["sync_interval"];
	        this.last_sync = this.convertValues(source["last_sync"], null);
	        this.created_at = this.convertValues(source["created_at"], null);
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
	export class CapitalTransaction {
	    id: number;
	    transaction_type: string;
	    amount: number;
	    balance_after: number;
	    notes: string;
	    // Go type: time
	    transaction_date: any;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new CapitalTransaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.transaction_type = source["transaction_type"];
	        this.amount = source["amount"];
	        this.balance_after = source["balance_after"];
	        this.notes = source["notes"];
	        this.transaction_date = this.convertValues(source["transaction_date"], null);
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
	export class ChecklistItem {
	    id: number;
	    checklist_type: string;
	    item_key: string;
	    item_label: string;
	    item_description: string;
	    display_order: number;
	    is_active: boolean;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new ChecklistItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.checklist_type = source["checklist_type"];
	        this.item_key = source["item_key"];
	        this.item_label = source["item_label"];
	        this.item_description = source["item_description"];
	        this.display_order = source["display_order"];
	        this.is_active = source["is_active"];
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
	export class SyncedTrade {
	    id: number;
	    broker_id: number;
	    broker_trade_id: string;
	    local_trade_id?: number;
	    symbol: string;
	    trade_type: string;
	    quantity: number;
	    price: number;
	    // Go type: time
	    trade_date: any;
	    sync_status: string;
	    raw_data: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new SyncedTrade(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.broker_id = source["broker_id"];
	        this.broker_trade_id = source["broker_trade_id"];
	        this.local_trade_id = source["local_trade_id"];
	        this.symbol = source["symbol"];
	        this.trade_type = source["trade_type"];
	        this.quantity = source["quantity"];
	        this.price = source["price"];
	        this.trade_date = this.convertValues(source["trade_date"], null);
	        this.sync_status = source["sync_status"];
	        this.raw_data = source["raw_data"];
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
	    progress: number;
	    due_date?: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    completed_at?: any;
	    // Go type: time
	    updated_at: any;
	
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
	        this.progress = source["progress"];
	        this.due_date = source["due_date"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.completed_at = this.convertValues(source["completed_at"], null);
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
	export class TaskLog {
	    id: number;
	    task_id: number;
	    log_message: string;
	    progress_snapshot: number;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new TaskLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.task_id = source["task_id"];
	        this.log_message = source["log_message"];
	        this.progress_snapshot = source["progress_snapshot"];
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
	    capital_protection_enabled: boolean;
	    protected_capital: number;
	    min_capital_threshold: number;
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
	        this.capital_protection_enabled = source["capital_protection_enabled"];
	        this.protected_capital = source["protected_capital"];
	        this.min_capital_threshold = source["min_capital_threshold"];
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

