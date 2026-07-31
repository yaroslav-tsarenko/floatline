CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('rifle', 'pistol', 'knife', 'gloves', 'smg', 'heavy', 'agent', 'sticker', 'other');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR', 'GBP');--> statement-breakpoint
CREATE TYPE "public"."exterior" AS ENUM('FN', 'MW', 'FT', 'WW', 'BS');--> statement-breakpoint
CREATE TYPE "public"."order_event_source" AS ENUM('user', 'sih_webhook', 'sih_poll', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('created', 'submitted', 'processing', 'sent', 'finished', 'failed', 'refunded', 'rolled_back');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."rarity" AS ENUM('consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'contraband');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_type" AS ENUM('deposit', 'purchase', 'refund', 'adjustment');--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"quote" "currency" PRIMARY KEY NOT NULL,
	"rate" numeric(12, 6) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"market_hash_name" text PRIMARY KEY NOT NULL,
	"app_id" integer NOT NULL,
	"name" text NOT NULL,
	"weapon" text,
	"skin_name" text,
	"exterior" "exterior",
	"is_stattrak" boolean DEFAULT false NOT NULL,
	"is_souvenir" boolean DEFAULT false NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL,
	"rarity" "rarity",
	"rarity_color" text,
	"phase" text,
	"image_hash" text,
	"cost_price" numeric(12, 4),
	"sell_price" numeric(12, 4),
	"steam_price" numeric(12, 4),
	"count" integer DEFAULT 0 NOT NULL,
	"market" text,
	"is_available" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"source" "order_event_source" NOT NULL,
	"from_status" text,
	"to_status" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_hash_name" text NOT NULL,
	"item_snapshot" jsonb NOT NULL,
	"shown_price" numeric(12, 2) NOT NULL,
	"cost_price" numeric(12, 4),
	"margin" numeric(12, 4),
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"sih_order_id" text,
	"sih_status" text,
	"sih_error" text,
	"steam_id" text,
	"trade_token" text,
	"sender_offer_id" text,
	"sender_nickname" text,
	"sender_avatar" text,
	"sender_timeout" integer,
	"protection_status" text,
	"protection_error" text,
	"protection_rollback_at" timestamp with time zone,
	"protection_rollback_amount" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_hash_name" text NOT NULL,
	"cost_price" numeric(12, 4),
	"steam_price" numeric(12, 4),
	"count" integer DEFAULT 0 NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"stats" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"steam_id64" text,
	"trade_token" text,
	"trade_url" text,
	"trade_url_updated_at" timestamp with time zone,
	"preferred_currency" "currency" DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "wallet_tx_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"order_id" uuid,
	"payment_id" uuid,
	"idempotency_key" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_balance_nonneg" CHECK ("wallets"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"method" text NOT NULL,
	"query" jsonb,
	"headers" jsonb,
	"body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_market_hash_name_items_market_hash_name_fk" FOREIGN KEY ("market_hash_name") REFERENCES "public"."items"("market_hash_name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_available_price_idx" ON "items" USING btree ("is_available","sell_price");--> statement-breakpoint
CREATE INDEX "items_category_exterior_idx" ON "items" USING btree ("category","exterior");--> statement-breakpoint
CREATE INDEX "items_rarity_idx" ON "items" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX "items_name_trgm_idx" ON "items" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_sih_order_id" ON "orders" USING btree ("sih_order_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_ref" ON "payments" USING btree ("provider_ref");--> statement-breakpoint
CREATE INDEX "payments_user_status_idx" ON "payments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "price_history_item_time_idx" ON "price_history" USING btree ("market_hash_name","captured_at");--> statement-breakpoint
CREATE INDEX "sync_runs_job_time_idx" ON "sync_runs" USING btree ("job","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_tx_idempotency_key" ON "wallet_transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "wallet_tx_user_idx" ON "wallet_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_logs_source_time_idx" ON "webhook_logs" USING btree ("source","created_at");