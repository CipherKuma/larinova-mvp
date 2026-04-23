drop extension if exists "pg_net";

create extension if not exists "postgis" with schema "public";

create type "public"."position_status" as enum ('pending', 'active', 'closed', 'failed');

create type "public"."trade_status" as enum ('pending', 'active', 'closed', 'failed');

create type "public"."trade_type" as enum ('swap', 'add_liquidity', 'remove_liquidity', 'perps_long', 'perps_short');

create sequence "public"."tangentx_market_stats_id_seq";

create sequence "public"."tangentx_markets_id_seq";

create sequence "public"."velox_bid_transactions_id_seq";

create sequence "public"."velox_maker_transactions_id_seq";

create sequence "public"."velox_taker_transactions_id_seq";


  create table "public"."agent_actions" (
    "id" uuid not null default gen_random_uuid(),
    "agent_id" uuid,
    "action_type" text not null,
    "is_recurring" boolean default false,
    "frequency" text,
    "cron_expression" text,
    "title" text not null,
    "description" text,
    "target_type" text,
    "target_id" uuid,
    "status" text default 'pending'::text,
    "priority" integer default 5,
    "config" jsonb default '{}'::jsonb,
    "result" jsonb default '{}'::jsonb,
    "error_message" text,
    "scheduled_for" timestamp with time zone,
    "last_executed_at" timestamp with time zone,
    "next_execution_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."agent_chats" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid,
    "sender_type" text not null,
    "message" text not null,
    "sentiment" numeric(3,2),
    "emotion" text,
    "key_topics" text[],
    "attachments" jsonb default '[]'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."agent_conversations" (
    "id" uuid not null default gen_random_uuid(),
    "agent_id" uuid,
    "profile_id" uuid,
    "title" text,
    "purpose" text,
    "channel" text,
    "status" text default 'active'::text,
    "summary" text,
    "outcome" text,
    "sentiment_overall" numeric(3,2),
    "started_at" timestamp with time zone default now(),
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."agent_pay_api_keys" (
    "id" uuid not null default gen_random_uuid(),
    "owner_address" text not null,
    "key_hash" text not null,
    "name" text,
    "can_manage_services" boolean default true,
    "can_view_analytics" boolean default true,
    "is_active" boolean default true,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."agent_pay_services" (
    "id" uuid not null default gen_random_uuid(),
    "owner_address" text not null,
    "name" text not null,
    "description" text,
    "endpoint_url" text not null,
    "method" text default 'POST'::text,
    "headers" jsonb default '{}'::jsonb,
    "price_per_request" bigint not null,
    "category" text,
    "tags" text[] default '{}'::text[],
    "icon_url" text,
    "input_schema" jsonb,
    "output_schema" jsonb,
    "is_active" boolean default true,
    "is_verified" boolean default false,
    "total_requests" bigint default 0,
    "total_revenue" bigint default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."agent_pay_usage" (
    "id" uuid not null default gen_random_uuid(),
    "service_id" uuid,
    "payer_address" text not null,
    "owner_address" text not null,
    "amount" bigint not null,
    "tx_hash" text,
    "request_timestamp" timestamp with time zone default now(),
    "response_status" integer,
    "latency_ms" integer,
    "request_body" jsonb,
    "response_preview" text,
    "payment_verified" boolean default false,
    "demo_mode" boolean default false,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."agents" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "display_name" text not null,
    "status" text default 'idle'::text,
    "mood" text default 'idle'::text,
    "character_prompt" text not null,
    "post_examples" jsonb default '[]'::jsonb,
    "message_examples" jsonb default '{"angry": [], "casual": [], "emotional": [], "professional": []}'::jsonb,
    "feelings" jsonb default '{}'::jsonb,
    "avatar_url" text,
    "voice_config" jsonb,
    "last_active_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "socials" jsonb
      );



  create table "public"."animoca_credential_schemas" (
    "id" text not null,
    "credential_type" text not null,
    "name" text not null,
    "description" text,
    "image" text,
    "credential_schema" jsonb,
    "updated_at" timestamp with time zone default now(),
    "issue_program_id" text,
    "verify_program_id" text
      );



  create table "public"."animoca_credentials" (
    "id" text not null,
    "name" text,
    "symbol" text,
    "description" text,
    "category" text,
    "token_address" text,
    "image_url" text,
    "owner_address" text,
    "credential_schema_id" text,
    "verification_tx_hash" text,
    "issued_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone
      );



  create table "public"."animoca_influencers" (
    "wallet_address" text not null,
    "token_address" text,
    "market_address" text,
    "token_symbol" text not null,
    "token_name" text not null,
    "display_name" text not null,
    "bio" text,
    "avatar_url" text,
    "twitter" text,
    "github" text,
    "linkedin" text,
    "website" text,
    "credential_id" text,
    "reputation_score" integer default 0,
    "last_verification_date" timestamp with time zone,
    "joined_date" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."animoca_trades" (
    "tx_hash" text not null,
    "token_address" text not null,
    "trader_address" text not null,
    "is_buy" boolean not null,
    "amount" numeric not null,
    "price" numeric,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."businesses" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "logo_url" text,
    "status" text default 'active'::text,
    "client_pin_hash" text not null,
    "client_contact_ids" uuid[],
    "partner_contact_ids" uuid[],
    "allow_public_access" boolean default false,
    "chat_enabled" boolean default false,
    "show_projects" boolean default true,
    "show_contacts" boolean default true,
    "show_meetings" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "collaborator_pin_hash" text
      );



  create table "public"."chats" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid,
    "sender" text not null,
    "message" text not null,
    "message_type" text default 'text'::text,
    "metadata" jsonb default '{}'::jsonb,
    "sentiment" numeric(3,2),
    "importance_level" integer default 5,
    "requires_action" boolean default false,
    "action_taken" boolean default false,
    "chat_references" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "edited_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
      );



  create table "public"."comm_styles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "prompt" text not null,
    "temperature" numeric(3,2) default 0.7,
    "max_tokens" integer default 150,
    "formality_level" integer default 5,
    "emoji_usage" boolean default false,
    "humor_level" integer default 0,
    "is_default" boolean default false,
    "is_custom" boolean default false,
    "created_by" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."commands" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid,
    "executed_by_agent_id" uuid,
    "command" text not null,
    "category" text,
    "status" text default 'running'::text,
    "output" text,
    "error_message" text,
    "execution_time_ms" integer,
    "delegated_to" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "agent_id" uuid,
    "title" text,
    "purpose" text,
    "project_id" uuid,
    "business_id" uuid,
    "session_id" uuid,
    "status" text default 'active'::text,
    "priority" text default 'medium'::text,
    "summary" text,
    "outcome" text,
    "action_items" jsonb default '[]'::jsonb,
    "decisions" jsonb default '[]'::jsonb,
    "agent_mood" text,
    "agent_performance_rating" integer,
    "started_at" timestamp with time zone default now(),
    "last_message_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."dxyperps_funding_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "market_id" uuid not null,
    "funding_rate" numeric(10,8) not null,
    "funding_time" timestamp with time zone not null,
    "open_interest_long" numeric(24,6) not null,
    "open_interest_short" numeric(24,6) not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_liquidations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "position_id" uuid not null,
    "trader_id" uuid not null,
    "market_id" uuid not null,
    "position_type" character varying(10) not null,
    "size" numeric(20,8) not null,
    "entry_price" numeric(20,6) not null,
    "liquidation_price" numeric(20,6) not null,
    "leverage" integer not null,
    "loss_amount" numeric(20,6) not null,
    "liquidated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_markets" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "symbol" character varying(10) not null,
    "name" character varying(50) not null,
    "base_asset" character varying(10) not null,
    "quote_asset" character varying(10) not null default 'USDT'::character varying,
    "min_size" numeric(20,8) not null,
    "max_size" numeric(20,8) not null,
    "tick_size" numeric(20,8) not null,
    "max_leverage" integer not null default 100,
    "maintenance_margin_rate" numeric(5,4) not null default 0.005,
    "initial_margin_rate" numeric(5,4) not null default 0.01,
    "maker_fee" numeric(5,4) not null default 0.0002,
    "taker_fee" numeric(5,4) not null default 0.0006,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_orders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "trader_id" uuid not null,
    "market_id" uuid not null,
    "position_id" uuid,
    "order_type" character varying(20) not null,
    "side" character varying(10) not null,
    "size" numeric(20,8) not null,
    "price" numeric(20,6),
    "executed_price" numeric(20,6),
    "executed_size" numeric(20,8) default 0,
    "fee" numeric(20,6) default 0,
    "leverage" integer not null,
    "status" character varying(20) not null default 'PENDING'::character varying,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "executed_at" timestamp with time zone,
    "tx_hash" character varying(66),
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_position_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "position_id" uuid not null,
    "trader_id" uuid not null,
    "market_id" uuid not null,
    "position_type" character varying(10) not null,
    "size" numeric(20,8) not null,
    "entry_price" numeric(20,6) not null,
    "exit_price" numeric(20,6) not null,
    "leverage" integer not null,
    "pnl" numeric(20,6) not null,
    "pnl_percentage" numeric(10,4) not null,
    "fees_paid" numeric(20,6) not null,
    "funding_paid" numeric(20,6) not null,
    "close_reason" character varying(20) not null,
    "opened_at" timestamp with time zone not null,
    "closed_at" timestamp with time zone not null,
    "duration_minutes" integer generated always as ((EXTRACT(epoch FROM (closed_at - opened_at)) / (60)::numeric)) stored,
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_positions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "trader_id" uuid not null,
    "market_id" uuid not null,
    "position_type" character varying(10) not null,
    "size" numeric(20,8) not null,
    "entry_price" numeric(20,6) not null,
    "mark_price" numeric(20,6) not null,
    "liquidation_price" numeric(20,6) not null,
    "leverage" integer not null,
    "initial_margin" numeric(20,6) not null,
    "maintenance_margin" numeric(20,6) not null,
    "margin_ratio" numeric(10,6) not null,
    "unrealized_pnl" numeric(20,6) not null default 0,
    "realized_pnl" numeric(20,6) not null default 0,
    "funding_paid" numeric(20,6) not null default 0,
    "stop_loss_price" numeric(20,6),
    "take_profit_price" numeric(20,6),
    "status" character varying(20) not null default 'OPEN'::character varying,
    "opened_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "closed_at" timestamp with time zone,
    "last_funding_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_price_snapshots" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "market_id" uuid not null,
    "open_price" numeric(20,6) not null,
    "high_price" numeric(20,6) not null,
    "low_price" numeric(20,6) not null,
    "close_price" numeric(20,6) not null,
    "volume" numeric(24,6) not null,
    "timeframe" character varying(10) not null,
    "timestamp" timestamp with time zone not null,
    "chain_id" integer not null default 80002
      );



  create table "public"."dxyperps_traders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "wallet_address" character varying(42) not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "total_pnl" numeric(20,6) default 0,
    "total_volume" numeric(24,6) default 0,
    "total_trades" integer default 0,
    "wins" integer default 0,
    "losses" integer default 0,
    "username" character varying(50),
    "avatar_url" text,
    "is_active" boolean default true,
    "last_trade_at" timestamp with time zone,
    "chain_id" integer not null default 80002
      );



  create table "public"."ember_chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "stream_id" uuid not null,
    "sender_address" text not null,
    "sender_name" text,
    "message" text not null,
    "is_seller" boolean default false,
    "created_at" timestamp with time zone default now(),
    "message_type" text default 'message'::text,
    "metadata" jsonb
      );


alter table "public"."ember_chat_messages" enable row level security;


  create table "public"."ember_order_details" (
    "id" uuid not null default gen_random_uuid(),
    "tx_hash" text not null,
    "buyer_address" text not null,
    "seller_address" text not null,
    "product_id" integer not null,
    "quantity" integer not null default 1,
    "total_price" bigint not null,
    "shipping_name" text not null,
    "shipping_phone" text not null,
    "shipping_address" text not null,
    "shipping_city" text not null,
    "shipping_postal_code" text,
    "shipping_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."ember_streams" (
    "id" uuid not null default gen_random_uuid(),
    "seller_address" text not null,
    "youtube_url" text not null,
    "featured_product_ids" integer[] default '{}'::integer[],
    "is_live" boolean default true,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."ember_streams" enable row level security;


  create table "public"."frameworks" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "repo_url" text not null,
    "branch_slug" text not null default 'main'::text,
    "logo_url" text,
    "category" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."hackathons" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "tier" text not null,
    "organizer" text not null,
    "organizer_logo_url" text,
    "link" text,
    "location" text,
    "dates" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "slug" text
      );



  create table "public"."konstant_nicknames" (
    "id" uuid not null default gen_random_uuid(),
    "owner_address" text not null,
    "target_address" text not null,
    "nickname" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."konstant_profiles" (
    "wallet_address" text not null,
    "display_name" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."labang_chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "stream_id" uuid not null,
    "user_address" text not null,
    "username" text,
    "message" text not null,
    "type" text default 'message'::text,
    "gift_amount" numeric,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."labang_daily_earnings" (
    "id" uuid not null default gen_random_uuid(),
    "user_address" text not null,
    "date" date not null,
    "watch_rewards" numeric default 0,
    "comment_rewards" numeric default 0,
    "total_rewards" numeric default 0
      );


alter table "public"."labang_daily_earnings" enable row level security;


  create table "public"."labang_orders" (
    "id" uuid not null default gen_random_uuid(),
    "onchain_order_id" text,
    "buyer_address" text not null,
    "seller_id" uuid,
    "product_id" uuid,
    "stream_id" uuid,
    "quantity" integer default 1,
    "total_price_very" numeric not null,
    "status" text default 'pending'::text,
    "shipping_name" text,
    "shipping_address" text,
    "shipping_phone" text,
    "tracking_number" text,
    "tx_hash" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."labang_products" (
    "id" uuid not null default gen_random_uuid(),
    "seller_id" uuid,
    "title" text not null,
    "title_ko" text,
    "description" text,
    "description_ko" text,
    "images" text[],
    "price_very" numeric not null,
    "inventory" integer default 0,
    "category" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."labang_reviews" (
    "id" uuid not null default gen_random_uuid(),
    "onchain_review_id" text,
    "order_id" uuid,
    "product_id" uuid,
    "buyer_address" text not null,
    "rating" integer,
    "content" text,
    "photos" text[],
    "is_verified" boolean default false,
    "tx_hash" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."labang_rewards" (
    "id" uuid not null default gen_random_uuid(),
    "user_address" text not null,
    "reward_type" text not null,
    "amount_very" numeric not null,
    "stream_id" uuid,
    "order_id" uuid,
    "review_id" uuid,
    "claimed" boolean default false,
    "claimed_at" timestamp with time zone,
    "tx_hash" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."labang_rewards" enable row level security;


  create table "public"."labang_sellers" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "shop_name" text not null,
    "shop_name_ko" text,
    "description" text,
    "category" text not null,
    "profile_image" text,
    "banner_image" text,
    "kyc_verified" boolean default false,
    "is_approved" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."labang_stream_products" (
    "id" uuid not null default gen_random_uuid(),
    "stream_id" uuid,
    "product_id" text,
    "display_order" integer default 0,
    "special_price_very" numeric,
    "is_featured" boolean default false,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."labang_streams" (
    "id" uuid not null default gen_random_uuid(),
    "seller_id" uuid,
    "title" text not null,
    "title_ko" text,
    "status" text default 'scheduled'::text,
    "stream_key" text,
    "playback_url" text,
    "thumbnail" text,
    "scheduled_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "viewer_count" integer default 0,
    "peak_viewers" integer default 0,
    "recording_url" text,
    "created_at" timestamp with time zone default now(),
    "youtube_url" text
      );



  create table "public"."labang_watch_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_address" text not null,
    "stream_id" uuid,
    "started_at" timestamp with time zone default now(),
    "last_heartbeat" timestamp with time zone default now(),
    "total_seconds" integer default 0,
    "is_active" boolean default true,
    "attention_check_pending" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."labang_watch_sessions" enable row level security;


  create table "public"."liquidity_history" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" character varying(42) not null,
    "transaction_hash" character varying(66),
    "action_type" character varying(10) not null,
    "amount_usdc" numeric(20,6) not null,
    "lp_tokens" numeric(20,8) not null,
    "lp_token_price" numeric(20,8) not null,
    "total_lp_balance_after" numeric(20,8) not null,
    "pool_tvl_after" numeric(20,6) not null,
    "timestamp" timestamp with time zone not null default now(),
    "block_number" bigint,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."meetings" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "title" text not null,
    "description" text,
    "date" timestamp with time zone not null,
    "duration" integer not null default 30,
    "attendees" jsonb default '[]'::jsonb,
    "google_event_id" text,
    "status" text default 'scheduled'::text,
    "meeting_link" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."meetings" enable row level security;


  create table "public"."memories" (
    "id" uuid not null default gen_random_uuid(),
    "agent_id" uuid,
    "profile_id" uuid,
    "memory_type" text not null,
    "category" text,
    "title" text not null,
    "content" text not null,
    "structured_data" jsonb default '{}'::jsonb,
    "importance_level" integer default 5,
    "confidence_score" numeric(3,2) default 0.5,
    "access_frequency" integer default 0,
    "relevance_score" numeric(3,2) default 0.5,
    "decay_rate" numeric(3,2) default 0.1,
    "last_accessed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."milestones" (
    "id" uuid not null default gen_random_uuid(),
    "workflow_id" uuid,
    "title" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."mocat_ai_ai_agents" (
    "id" uuid not null default gen_random_uuid(),
    "developer_id" uuid,
    "agent_name" text not null,
    "agent_description" text,
    "tee_deployment_url" text,
    "agent_version" text not null default '1.0.0'::text,
    "tee_logic_hash" text,
    "total_validations" integer default 0,
    "wins" integer default 0,
    "losses" integer default 0,
    "per_analysis_fee" numeric(20,8) default 0,
    "total_revenue" numeric(20,8) default 0,
    "available_revenue" numeric(20,8) default 0,
    "is_active" boolean default true,
    "deployed_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "image_url" text,
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002,
    "endpoint" text,
    "card_url" text,
    "agent_id" text,
    "specialization" text,
    "capabilities" text[] default '{}'::text[]
      );



  create table "public"."mocat_ai_clusters" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "agent_ids" uuid[] not null,
    "cluster_name" text,
    "user_preferences" jsonb default '{}'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002,
    "hcs_topic_id" text
      );



  create table "public"."mocat_ai_consensus_records" (
    "id" uuid not null default gen_random_uuid(),
    "orchestration_id" text not null,
    "signal_id" uuid not null,
    "cluster_id" uuid not null,
    "user_id" uuid not null,
    "agent_analyses" jsonb not null,
    "consensus_decision" text not null,
    "consensus_confidence" numeric(5,2) not null,
    "consensus_breakdown" jsonb not null,
    "execution_decision" text not null,
    "hcs_topic_id" text,
    "hcs_sequence_number" bigint,
    "duration_ms" integer,
    "created_at" timestamp with time zone default now(),
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_copy_trading" (
    "id" uuid not null default gen_random_uuid(),
    "follower_id" uuid,
    "expert_trader_id" uuid,
    "signal_id" uuid,
    "copy_amount" numeric(20,8) not null,
    "usdt_amount" numeric(20,8) not null,
    "leverage" integer default 1,
    "trade_status" text not null,
    "executed_at" timestamp with time zone,
    "exit_price" numeric(20,8),
    "pnl_amount" numeric(20,8),
    "pnl_percent" numeric(10,4),
    "expert_fee_paid" numeric(20,8) default 0,
    "agent_fee_paid" numeric(20,8) default 0,
    "created_at" timestamp with time zone default now(),
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_expert_traders" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "total_followers" integer default 0,
    "total_signals_posted" integer default 0,
    "wins" integer default 0,
    "losses" integer default 0,
    "total_win_amount" numeric(20,8) default 0,
    "total_loss_amount" numeric(20,8) default 0,
    "profit_cut" numeric(5,2) default 10.00,
    "available_revenue" numeric(20,8) default 0,
    "reputation_score" integer default 0,
    "bio" text,
    "is_verified" boolean default false,
    "verification_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_follows" (
    "id" uuid not null default gen_random_uuid(),
    "follower_id" uuid not null,
    "expert_trader_id" uuid not null,
    "followed_at" timestamp with time zone default now(),
    "is_active" boolean default true,
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_moca_credentials" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "credential_type" text not null,
    "credential_id" text not null,
    "issuer_did" text not null,
    "verification_status" text not null,
    "verification_date" timestamp with time zone,
    "expiration_date" timestamp with time zone,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "verification_tx_hash" text not null,
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_signal_validations" (
    "id" uuid not null default gen_random_uuid(),
    "signal_id" uuid,
    "agent_id" uuid,
    "validation_result" text not null,
    "confidence_score" integer,
    "reasoning" text,
    "validation_data" jsonb,
    "validated_at" timestamp with time zone default now(),
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_trading_signals" (
    "id" uuid not null default gen_random_uuid(),
    "expert_trader_id" uuid,
    "direction" text not null,
    "trading_pair" text not null,
    "chain" text not null,
    "protocol" text not null,
    "entry_price" numeric(20,8) not null,
    "stop_loss" numeric(20,8),
    "take_profit" numeric(20,8),
    "leverage" integer default 1,
    "reasoning" text,
    "confidence_score" integer,
    "trade_status" text not null default 'active'::text,
    "posted_at" timestamp with time zone default now(),
    "closed_at" timestamp with time zone,
    "actual_exit_price" numeric(20,8),
    "pnl_percentage" numeric(10,4),
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."mocat_ai_users" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "display_name" text,
    "line_user_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_active" boolean default true,
    "image_url" text default ''::text,
    "smart_account_address" text default '0x0000000000000000000000000000000000000000'::text,
    "is_testnet" boolean not null default true,
    "chain_id" integer not null default 80002
      );



  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "type" text not null,
    "priority" text default 'medium'::text,
    "status" text default 'unread'::text,
    "title" text not null,
    "description" text,
    "agent_id" uuid,
    "profile_id" uuid,
    "business_id" uuid,
    "project_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "action_url" text,
    "action_label" text,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."playwright_allocations" (
    "id" uuid not null default gen_random_uuid(),
    "server_id" text not null,
    "category" text not null,
    "instance_number" integer not null,
    "project_id" uuid,
    "session_id" uuid,
    "storage_state_path" text not null,
    "port" integer not null,
    "status" text default 'available'::text,
    "allocated_at" timestamp with time zone,
    "released_at" timestamp with time zone,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "character_id" integer not null,
    "socials" jsonb default '{}'::jsonb,
    "style" jsonb default '{}'::jsonb,
    "feelings" jsonb default '{}'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "name" text,
    "pfp" text
      );



  create table "public"."project_b2b_clients" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "business_id" uuid not null,
    "client_name" text not null,
    "client_email" text,
    "client_company" text,
    "plan" text not null,
    "mrr" numeric(12,2) not null default 0,
    "status" text not null,
    "customer_since" date not null,
    "contract_end_date" date,
    "metadata" jsonb default '{}'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."project_network_activity" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "business_id" uuid not null,
    "network" text not null,
    "tx_count" integer not null default 0,
    "percentage" numeric(5,2) not null default 0,
    "last_updated" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."project_onchain_metrics" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "business_id" uuid not null,
    "network" text not null,
    "total_volume" numeric(30,6) default 0,
    "transaction_count" integer default 0,
    "avg_tps" numeric(10,2) default 0,
    "profit" numeric(30,6) default 0,
    "additional_metrics" jsonb default '{}'::jsonb,
    "last_updated" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."project_onchain_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "business_id" uuid not null,
    "network" text not null,
    "tx_hash" text not null,
    "amount" numeric(30,6) not null,
    "tx_type" text not null,
    "status" text not null,
    "from_address" text,
    "to_address" text,
    "metadata" jsonb default '{}'::jsonb,
    "occurred_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."project_social_activities" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "business_id" uuid not null,
    "platform" text not null,
    "activity_type" text not null,
    "description" text not null,
    "metadata" jsonb default '{}'::jsonb,
    "occurred_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."project_social_metrics" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "business_id" uuid not null,
    "platform" text not null,
    "metrics" jsonb not null default '{}'::jsonb,
    "sentiment_positive" numeric(5,2) default 0,
    "sentiment_neutral" numeric(5,2) default 0,
    "sentiment_negative" numeric(5,2) default 0,
    "last_updated" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."project_wallets" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "chain" text not null,
    "ecosystem" text not null,
    "address" text not null,
    "private_key" text not null,
    "public_key" text,
    "mnemonic" text,
    "secret_key" text,
    "balance" numeric(20,8) default 0,
    "last_balance_check" timestamp with time zone,
    "last_funded_at" timestamp with time zone,
    "total_funded" numeric(20,8) default 0,
    "funding_count" integer default 0,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."project_wallets" enable row level security;


  create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "hackathon_id" uuid,
    "managing_agent_id" uuid,
    "title" text not null,
    "description" text,
    "readme" text,
    "prd" text,
    "image_url" text,
    "association_type" text default 'personal'::text,
    "tags" text[],
    "public_url" text,
    "is_template" boolean default false,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "repo_slug" text,
    "project_path" text,
    "framework_id" uuid,
    "repo_url" text,
    "status" text default 'ideation'::text,
    "social_links" jsonb default '{}'::jsonb,
    "contract_addresses" jsonb default '{}'::jsonb,
    "primary_network" text
      );



  create table "public"."salvation_businesses" (
    "wallet_address" text not null,
    "name" text not null,
    "website" text,
    "description" text,
    "founding_date" date,
    "cover_image_url" text,
    "pfp_image_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."salvation_conversations" (
    "id" uuid not null default gen_random_uuid(),
    "application_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."salvation_ipfs_metadata" (
    "id" uuid not null default gen_random_uuid(),
    "cid" text not null,
    "content" text not null,
    "content_type" text default 'application/json'::text,
    "filename" text,
    "size" integer,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."salvation_ipfs_metadata" enable row level security;


  create table "public"."salvation_project_applications" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "project_name" text not null,
    "description" text not null,
    "category" text not null,
    "image_url" text,
    "country" text not null,
    "region" text not null,
    "latitude" numeric,
    "longitude" numeric,
    "funding_goal" numeric not null,
    "bond_price" numeric not null default 1.00,
    "revenue_model" text not null,
    "projected_apy" numeric not null,
    "milestones" jsonb not null default '[]'::jsonb,
    "status" text not null default 'pending'::text,
    "agent_analysis" jsonb,
    "final_funding_goal" numeric,
    "final_projected_apy" numeric,
    "final_milestones" jsonb,
    "project_id" text,
    "tx_hash" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_api_keys" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "name" text not null,
    "key_hash" text not null,
    "key_prefix" text not null,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_debugger_runs" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "project_id" uuid,
    "network" text not null,
    "sender_address" text not null,
    "module_address" text not null,
    "module_name" text not null,
    "function_name" text not null,
    "type_arguments" jsonb default '[]'::jsonb,
    "arguments" jsonb default '[]'::jsonb,
    "total_steps" integer default 0,
    "total_gas" bigint default 0,
    "result" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_gas_analyses" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "project_id" uuid,
    "network" text not null,
    "sender_address" text not null,
    "module_address" text not null,
    "module_name" text not null,
    "function_name" text not null,
    "type_arguments" jsonb default '[]'::jsonb,
    "arguments" jsonb default '[]'::jsonb,
    "total_gas" bigint default 0,
    "top_operation" text,
    "top_function" text,
    "suggestions_count" integer default 0,
    "result" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_projects" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "name" text not null,
    "description" text,
    "network" text default 'testnet'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_prover_runs" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "project_id" uuid,
    "code" text not null,
    "modules" jsonb default '[]'::jsonb,
    "status" text not null,
    "duration_ms" integer,
    "results" jsonb default '{}'::jsonb,
    "error_message" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_simulations" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" text not null,
    "project_id" uuid,
    "network" text not null,
    "sender_address" text not null,
    "module_address" text not null,
    "module_name" text not null,
    "function_name" text not null,
    "type_arguments" jsonb default '[]'::jsonb,
    "arguments" jsonb default '[]'::jsonb,
    "success" boolean not null,
    "gas_used" bigint,
    "vm_status" text,
    "state_changes" jsonb default '[]'::jsonb,
    "events" jsonb default '[]'::jsonb,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "result" jsonb
      );



  create table "public"."sentinel_team_invites" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid not null,
    "invite_token" text not null,
    "invited_by" text not null,
    "role" text not null default 'member'::text,
    "expires_at" timestamp with time zone not null,
    "used_at" timestamp with time zone,
    "used_by" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_team_members" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid not null,
    "wallet_address" text not null,
    "role" text not null default 'member'::text,
    "joined_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_teams" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "owner_wallet" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."sentinel_users" (
    "wallet_address" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "last_login_at" timestamp with time zone
      );



  create table "public"."service_key_audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "service_key_public" text not null,
    "action" text not null,
    "hedera_account_id" text,
    "hedera_transaction_id" text,
    "performed_by" uuid,
    "metadata" jsonb,
    "ip_address" inet,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sessions" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "managing_agent_id" uuid,
    "session_identifier" text not null,
    "project_path" text,
    "status" text default 'active'::text,
    "context_usage" integer default 0,
    "input_token_count" integer default 0,
    "output_token_count" integer default 0,
    "tool_calls" jsonb default '[]'::jsonb,
    "thinking_logs" jsonb default '[]'::jsonb,
    "output_logs" jsonb default '[]'::jsonb,
    "checkpoint_data" jsonb default '{"todos": [], "blockers": [], "decisions": [], "files_modified": [], "completed_tasks": []}'::jsonb,
    "started_at" timestamp with time zone default now(),
    "paused_at" timestamp with time zone,
    "terminated_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."shinroe_users" (
    "id" uuid not null default gen_random_uuid(),
    "address" text not null,
    "display_name" text,
    "avatar_url" text,
    "bio" text,
    "verychat_handle" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "verychat_id" text
      );



  create table "public"."tangentx_market_stats" (
    "id" integer not null default nextval('public.tangentx_market_stats_id_seq'::regclass),
    "market_id" integer not null,
    "date" date not null default CURRENT_DATE,
    "open_price" numeric(18,6) not null,
    "high_price" numeric(18,6) not null,
    "low_price" numeric(18,6) not null,
    "close_price" numeric(18,6) not null,
    "volume" numeric(18,6) default 0,
    "trade_count" integer default 0
      );



  create table "public"."tangentx_markets" (
    "id" integer not null default nextval('public.tangentx_markets_id_seq'::regclass),
    "credential_type" text not null,
    "name" text not null,
    "description" text,
    "current_index" numeric(18,6) not null default 100,
    "baseline_index" numeric(18,6) not null default 100,
    "total_long" numeric(18,6) default 0,
    "total_short" numeric(18,6) default 0,
    "funding_rate" numeric(18,6) default 0,
    "last_update" timestamp with time zone default now(),
    "active" boolean default true,
    "max_leverage" integer default 10,
    "min_position_size" numeric(18,6) default 10,
    "max_position_size" numeric(18,6) default 10000,
    "image_url" text
      );



  create table "public"."tangentx_positions" (
    "id" uuid not null default gen_random_uuid(),
    "user_address" text not null,
    "market_id" integer not null,
    "size" numeric(18,6) not null,
    "leverage" integer not null,
    "entry_price" numeric(18,6) not null,
    "collateral" numeric(18,6) not null,
    "is_long" boolean not null,
    "created_at" timestamp with time zone default now(),
    "closed_at" timestamp with time zone,
    "status" text default 'open'::text,
    "realized_pnl" numeric(18,6) default 0,
    "funding_paid" numeric(18,6) default 0,
    "last_funding_update" timestamp with time zone default now()
      );



  create table "public"."tangentx_trades" (
    "id" uuid not null default gen_random_uuid(),
    "position_id" uuid not null,
    "action" text not null,
    "price" numeric(18,6) not null,
    "size" numeric(18,6) not null,
    "fee" numeric(18,6) not null,
    "gas_fee" numeric(18,6) default 0,
    "timestamp" timestamp with time zone default now(),
    "tx_hash" text,
    "block_number" bigint
      );



  create table "public"."tangentx_users" (
    "id" uuid not null default gen_random_uuid(),
    "address" text not null,
    "created_at" timestamp with time zone default now(),
    "total_pnl" numeric(18,6) default 0,
    "trade_count" integer default 0,
    "last_login" timestamp with time zone default now(),
    "collateral_balance" numeric(18,6) default 0,
    "referral_code" text,
    "referred_by" text
      );



  create table "public"."task_dependencies" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid,
    "depends_on_task_id" uuid,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "milestone_id" uuid,
    "title" text not null,
    "description" text,
    "prompt" text,
    "priority" integer default 5,
    "status" text default 'not_started'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."testnet_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "transaction_hash" text,
    "network" text not null,
    "type" text not null,
    "amount" numeric(20,8) not null,
    "currency" text not null,
    "amount_usd" numeric(20,8),
    "from_address" text,
    "to_address" text,
    "category" text,
    "description" text,
    "needs_categorization" boolean default false,
    "metadata" jsonb default '{}'::jsonb,
    "transaction_date" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."testnet_wallets" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "address" text not null,
    "chain" text not null,
    "balance" numeric(20,8) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_id" uuid,
    "transaction_hash" text,
    "network" text not null,
    "type" text not null,
    "amount" numeric(20,8) not null,
    "currency" text not null,
    "amount_usd" numeric(20,8),
    "from_address" text,
    "to_address" text,
    "category" text,
    "description" text,
    "business_id" uuid,
    "project_id" uuid,
    "needs_categorization" boolean default false,
    "metadata" jsonb default '{}'::jsonb,
    "transaction_date" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."urejesho_ai_proposals" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "project_id" uuid not null,
    "voting_proposal_id" uuid,
    "iteration_number" integer not null default 1,
    "parent_proposal_id" uuid,
    "ngo_requested_amount_usd" numeric(20,6) not null,
    "ai_recommended_amount_usd" numeric(20,6) not null,
    "reasoning" text not null,
    "global_pool_balance_usd" numeric(20,6) not null,
    "risk_ngo_credibility" numeric(5,4) not null,
    "risk_milestone_feasibility" numeric(5,4) not null,
    "risk_budget_accuracy" numeric(5,4) not null,
    "risk_timeline_realism" numeric(5,4) not null,
    "risk_overall" numeric(5,4) not null,
    "initial_funding_usd" numeric(20,6) not null,
    "initial_funding_percentage" numeric(5,2) not null,
    "milestone_breakdown" jsonb not null,
    "confidence_level" numeric(5,4) not null,
    "key_factors" text[],
    "concerns" text[],
    "ai_session_id" text not null,
    "ai_model" text not null,
    "status" text not null,
    "created_at" timestamp with time zone not null default now(),
    "analysis_document_cid" text
      );



  create table "public"."urejesho_ai_verifications" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "milestone_id" uuid not null,
    "verified" boolean not null,
    "confidence_score" numeric(5,4) not null,
    "reasoning" text not null,
    "news_sources" jsonb not null,
    "completion_indicators" text[],
    "discrepancies" text[],
    "requires_human_review" boolean not null default false,
    "human_review_reason" text,
    "human_reviewed" boolean default false,
    "human_reviewer_id" uuid,
    "human_review_decision" text,
    "human_review_notes" text,
    "human_reviewed_at" timestamp with time zone,
    "ai_session_id" text not null,
    "ai_model" text not null,
    "created_at" timestamp with time zone not null default now(),
    "verification_report_cid" text
      );



  create table "public"."urejesho_donations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "user_id" uuid,
    "user_hedera_account_id" text not null,
    "amount_tokens" numeric(20,6) not null,
    "amount_usd" numeric(20,6) not null,
    "donated_to_global_pool" boolean default true,
    "category" text,
    "hedera_transaction_id" text not null,
    "consensus_timestamp" timestamp with time zone not null,
    "donation_type" text,
    "percentage_value" numeric(5,4),
    "original_tx_hash" text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_file_registry" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null,
    "file_type" text not null,
    "file_name" text not null,
    "file_size_bytes" bigint not null,
    "mime_type" text not null,
    "storage_type" text not null,
    "hfs_file_id" text,
    "ipfs_cid" text,
    "owner_id" text not null,
    "owner_type" text not null,
    "related_project_id" uuid,
    "related_milestone_id" uuid,
    "related_ngo_id" uuid,
    "content_hash" text not null,
    "provenance_topic_id" text,
    "provenance_message_id" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_global_pool_config" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null,
    "hedera_account_id" text not null,
    "smart_contract_address" text not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_impact_badges" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "user_id" uuid not null,
    "account_id" text not null,
    "tier" text not null,
    "nft_token_id" text not null,
    "ipfs_metadata_cid" text not null,
    "hfs_file_id" text,
    "total_donations_usd" numeric(20,6) not null,
    "countries_supported" integer default 0,
    "categories_supported" integer default 0,
    "projects_supported" integer default 0,
    "awarded_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_milestones" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "hedera_milestone_id" text,
    "guardian_document_id" text,
    "project_id" uuid not null,
    "milestone_number" integer not null,
    "description" text not null,
    "funding_allocation_usd" numeric(20,6) not null,
    "is_initial_funding" boolean default false,
    "expected_completion_date" date,
    "submitted_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "funded_at" timestamp with time zone,
    "status" text not null default 'pending'::text,
    "evidence_photos" text[] default '{}'::text[],
    "satellite_images" text[] default '{}'::text[],
    "documents" text[] default '{}'::text[],
    "gps_coordinates" jsonb,
    "ai_verification_id" uuid,
    "ai_verified" boolean default false,
    "ai_verification_confidence" numeric(5,4),
    "requires_human_review" boolean default false,
    "verification_method" text,
    "verification_data" jsonb,
    "rejection_reason" text,
    "hcs_submission_message_id" text,
    "hcs_verification_message_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "title" text,
    "short_description" text,
    "long_description" text,
    "success_criteria" jsonb default '[]'::jsonb
      );



  create table "public"."urejesho_ngo_credentials" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null,
    "ngo_id" uuid not null,
    "did" text not null,
    "did_document" jsonb not null,
    "did_topic_id" text not null,
    "credential" jsonb not null,
    "credential_id" text not null,
    "credential_type" text[] not null,
    "hcs_topic_id" text not null,
    "hcs_message_id" text,
    "consensus_timestamp" timestamp with time zone,
    "issuer_did" text not null,
    "issuer_name" text not null default 'UREJESHO Platform'::text,
    "issued_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "revoked" boolean default false,
    "revoked_at" timestamp with time zone,
    "revoked_reason" text,
    "suspended" boolean default false,
    "suspended_at" timestamp with time zone,
    "suspended_reason" text,
    "verification_documents" text[],
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_ngos" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "hedera_account_id" text not null,
    "name" text not null,
    "description" text,
    "website" text,
    "email" text not null,
    "country" text not null,
    "verification_status" text not null default 'pending'::text,
    "did_credential_id" text,
    "verification_documents" text[],
    "verified_at" timestamp with time zone,
    "registration_number" text,
    "registration_country" text,
    "registration_documents" text[],
    "total_projects" integer default 0,
    "funding_received_usd" numeric(20,6) default 0,
    "completed_projects" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "logo_url" text,
    "type" text,
    "phone" text,
    "tax_id" text,
    "year_established" integer,
    "mission" text,
    "street" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "representative_name" text,
    "representative_title" text,
    "representative_email" text,
    "representative_phone" text,
    "twitter" text,
    "linkedin" text,
    "facebook" text,
    "sectors" jsonb default '[]'::jsonb
      );



  create table "public"."urejesho_project_updates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null,
    "project_id" uuid not null,
    "ngo_id" uuid not null,
    "title" text not null,
    "content" text not null,
    "images" text[] default '{}'::text[],
    "documents" text[] default '{}'::text[],
    "hcs_message_id" text,
    "consensus_timestamp" timestamp with time zone,
    "is_public" boolean default true,
    "is_milestone_update" boolean default false,
    "related_milestone_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_projects" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "guardian_document_id" text,
    "ngo_id" uuid not null,
    "name" text not null,
    "description" text not null,
    "category" text,
    "country" text not null,
    "region" text,
    "location" public.geography(Point,4326) not null,
    "latitude" numeric(10,8) not null,
    "longitude" numeric(11,8) not null,
    "ngo_requested_amount_usd" numeric(20,6) not null,
    "ai_approved_amount_usd" numeric(20,6),
    "amount_funded_usd" numeric(20,6) default 0,
    "initial_fund_amount_usd" numeric(20,6),
    "initial_fund_released" boolean default false,
    "initial_fund_released_at" timestamp with time zone,
    "start_date" date,
    "expected_completion_date" date,
    "actual_completion_date" date,
    "status" text not null default 'voting'::text,
    "proposal_document_ipfs" text,
    "images" text[] default '{}'::text[],
    "beneficiary_count" integer default 0,
    "milestone_count" integer default 0,
    "completed_milestone_count" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "hfs_file_id" text,
    "short_description" text,
    "long_description" text,
    "expected_impact" text[] default '{}'::text[]
      );



  create table "public"."urejesho_satellite_imagery" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "project_id" uuid not null,
    "milestone_id" uuid,
    "ipfs_cid" text not null,
    "acquisition_date" date not null,
    "satellite_source" text default 'Sentinel-2'::text,
    "resolution_meters" numeric(10,2),
    "cloud_coverage_percent" numeric(5,2),
    "layer_type" text not null,
    "change_detected" boolean default false,
    "confidence_score" numeric(5,4),
    "changed_area_sqm" numeric(20,2),
    "analysis_data" jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_saved_projects" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null,
    "user_hedera_account_id" text not null,
    "project_id" uuid not null,
    "saved_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "hedera_account_id" text not null,
    "did" text,
    "name" text,
    "avatar_ipfs_cid" text,
    "bio" text,
    "country" text,
    "countries_of_interest" text[] default '{}'::text[],
    "total_donations_usd" numeric(20,6) default 0,
    "lifetime_contribution_usd" numeric(20,6) default 0,
    "projects_supported" integer default 0,
    "current_badge_tier" text,
    "notification_preferences" jsonb default '{"push": true, "email": true, "voting": true, "milestone": true}'::jsonb,
    "privacy_settings" jsonb default '{"profile_public": true, "donations_public": false, "location_visible": true}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_vault_fee_accounts" (
    "hedera_account_id" text not null,
    "user_id" uuid,
    "threshold_key_enabled" boolean default false,
    "service_key_public" text not null,
    "user_original_key" text not null,
    "donation_mode" text not null default 'per_transaction'::text,
    "per_transaction_amount" bigint not null default 100000,
    "per_transaction_enabled" boolean default false,
    "monthly_amount" bigint not null default 1000000,
    "monthly_enabled" boolean default false,
    "monthly_charge_day" integer default 1,
    "next_monthly_charge" timestamp with time zone,
    "last_monthly_charge" timestamp with time zone,
    "authorized_allowance" bigint not null default 0,
    "remaining_allowance" bigint not null default 0,
    "allowance_expires_at" timestamp with time zone,
    "total_fees_collected" bigint not null default 0,
    "transaction_count" integer not null default 0,
    "monthly_charge_count" integer not null default 0,
    "last_transaction_at" timestamp with time zone,
    "is_active" boolean default true,
    "pause_reason" text,
    "paused_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."urejesho_vault_fee_monitoring_state" (
    "hedera_account_id" text not null,
    "last_checked_consensus_timestamp" timestamp with time zone,
    "last_processed_transaction_id" text,
    "is_monitoring" boolean default true,
    "consecutive_errors" integer default 0,
    "last_error_message" text,
    "last_error_at" timestamp with time zone,
    "monitoring_started_at" timestamp with time zone default now(),
    "monitoring_stopped_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."urejesho_vault_fee_monthly_schedule" (
    "id" uuid not null default gen_random_uuid(),
    "hedera_account_id" text not null,
    "scheduled_date" date not null,
    "amount" bigint not null,
    "status" text not null default 'scheduled'::text,
    "hedera_transaction_id" text,
    "error_message" text,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."urejesho_vault_fee_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "hedera_account_id" text not null,
    "hedera_transaction_id" text not null,
    "collection_type" text not null,
    "vault_fee_amount" bigint not null,
    "original_transaction_id" text,
    "status" text not null default 'pending'::text,
    "error_message" text,
    "consensus_timestamp" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."urejesho_votes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "proposal_id" uuid not null,
    "user_id" uuid,
    "voter_account_id" text not null,
    "vote_choice" text not null,
    "voting_power" numeric(20,6) not null,
    "hcs_message_id" text not null,
    "consensus_timestamp" timestamp with time zone not null,
    "did_signature" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."urejesho_voting_proposals" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "chain" text not null default 'testnet'::text,
    "project_id" uuid not null,
    "ai_proposal_id" uuid,
    "guardian_document_id" text,
    "title" text not null,
    "description" text not null,
    "ngo_requested_amount" numeric(20,6) not null,
    "ai_proposed_amount" numeric(20,6) not null,
    "ai_analysis_reasoning" text,
    "iteration_number" integer default 1,
    "parent_proposal_id" uuid,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "total_votes" integer default 0,
    "accept_votes" integer default 0,
    "increase_votes" integer default 0,
    "decrease_votes" integer default 0,
    "reject_votes" integer default 0,
    "total_voting_power" numeric(20,6) default 0,
    "accept_voting_power" numeric(20,6) default 0,
    "increase_voting_power" numeric(20,6) default 0,
    "decrease_voting_power" numeric(20,6) default 0,
    "reject_voting_power" numeric(20,6) default 0,
    "status" text not null default 'pending'::text,
    "hcs_result_message_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."vault_fee_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "hedera_account_id" text not null,
    "user_id" uuid,
    "threshold_key_enabled" boolean default false,
    "threshold_key_setup_at" timestamp with time zone,
    "service_key_public" text not null,
    "user_original_key" text,
    "vault_fee_amount" bigint default 100000,
    "vault_fee_enabled" boolean default true,
    "total_fees_collected" bigint default 0,
    "transaction_count" integer default 0,
    "last_transaction_at" timestamp with time zone,
    "is_active" boolean default true,
    "opt_out_reason" text,
    "opted_out_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."vault_fee_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "hedera_transaction_id" text not null,
    "hedera_account_id" text not null,
    "vault_fee_amount" bigint not null,
    "original_transaction_amount" bigint,
    "transaction_type" text,
    "consensus_timestamp" timestamp with time zone,
    "transaction_memo" text,
    "status" text default 'pending'::text,
    "error_message" text,
    "retry_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "processed_at" timestamp with time zone
      );



  create table "public"."velox_bid_transactions" (
    "id" integer not null default nextval('public.velox_bid_transactions_id_seq'::regclass),
    "intent_id" text not null,
    "bid_tx_hash" text not null,
    "solver_address" text not null,
    "bid_amount" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."velox_maker_transactions" (
    "id" bigint not null default nextval('public.velox_maker_transactions_id_seq'::regclass),
    "intent_id" text not null,
    "maker_tx_hash" text not null,
    "user_address" text not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."velox_taker_transactions" (
    "id" bigint not null default nextval('public.velox_taker_transactions_id_seq'::regclass),
    "intent_id" text not null,
    "taker_tx_hash" text not null,
    "solver_address" text not null,
    "fill_amount" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."wallets" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "address" text not null,
    "chain" text not null,
    "balance" numeric(20,8) default 0,
    "doxxed" boolean default false,
    "token_balances" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."workflows" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "title" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."yellowdotfun_comment_likes" (
    "id" uuid not null default gen_random_uuid(),
    "comment_id" uuid not null,
    "user_address" text not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."yellowdotfun_comments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "token_id" uuid not null,
    "user_address" text not null,
    "parent_comment_id" uuid,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "edited_at" timestamp with time zone,
    "is_deleted" boolean default false,
    "image_url" text,
    "likes_count" integer default 0
      );



  create table "public"."yellowdotfun_creator_earnings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "creator_address" text not null,
    "token_id" uuid not null,
    "total_fees_earned" numeric default 0,
    "total_fees_claimed" numeric default 0,
    "last_claim_at" timestamp with time zone,
    "last_fee_at" timestamp with time zone
      );



  create table "public"."yellowdotfun_tokens" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "ticker" text not null,
    "name" text not null,
    "description" text,
    "image_url" text,
    "creator_address" text not null,
    "bonding_curve_k" numeric not null,
    "total_supply" numeric not null,
    "circulating_supply" numeric not null default 0,
    "creator_fee_percentage" numeric not null default 1.0,
    "created_at" timestamp with time zone not null default now(),
    "launch_block" bigint,
    "is_graduated" boolean default false,
    "graduated_at" timestamp with time zone,
    "liquidity_pool_address" text,
    "volume_24h" numeric default 0,
    "volume_7d" numeric default 0,
    "volume_total" numeric default 0,
    "trade_count_24h" integer default 0,
    "trade_count_total" integer default 0,
    "holder_count" integer default 0,
    "last_trade_at" timestamp with time zone,
    "initial_virtual_sol_reserves" numeric not null default 30,
    "initial_virtual_token_reserves" numeric not null default 1073000000
      );



  create table "public"."yellowdotfun_top_holders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "token_id" uuid not null,
    "user_address" text not null,
    "balance" numeric not null,
    "percentage_held" numeric not null,
    "rank" integer not null,
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."yellowdotfun_trades" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "token_id" uuid not null,
    "trader_address" text not null,
    "trade_type" text not null,
    "token_amount" numeric not null,
    "sol_amount" numeric not null,
    "price_per_token" numeric not null,
    "creator_fee_amount" numeric default 0,
    "timestamp" timestamp with time zone not null default now(),
    "tx_signature" text,
    "block_number" bigint,
    "virtual_sol_reserves" numeric not null,
    "virtual_token_reserves" numeric not null
      );



  create table "public"."yellowdotfun_user_balances" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_address" text not null,
    "token_id" uuid not null,
    "balance" numeric not null default 0,
    "total_bought" numeric default 0,
    "total_sold" numeric default 0,
    "avg_buy_price" numeric default 0,
    "first_bought_at" timestamp with time zone,
    "last_updated" timestamp with time zone default now()
      );



  create table "public"."yellowdotfun_watchlist" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_address" text not null,
    "token_id" uuid not null,
    "added_at" timestamp with time zone default now()
      );



  create table "public"."yellowperps_level_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "old_level" integer,
    "new_level" integer,
    "profit_milestone" numeric(20,6),
    "credit_multiplier" integer,
    "dev_deposit_amount" numeric(20,6),
    "upgraded_at" timestamp without time zone default now()
      );



  create table "public"."yellowperps_positions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "symbol" character varying(20) not null,
    "side" character varying(10) not null,
    "size" numeric(20,8) not null,
    "entry_price" numeric(20,8) not null,
    "leverage" integer not null,
    "margin_cbtc" numeric(20,6) not null,
    "status" character varying(20) default 'OPEN'::character varying,
    "opened_at" timestamp without time zone default now(),
    "closed_at" timestamp without time zone,
    "closed_price" numeric(20,8),
    "realized_pnl" numeric(20,6),
    "fees_cbtc" numeric(20,6)
      );



  create table "public"."yellowperps_price_feeds" (
    "symbol" character varying(20) not null,
    "price" numeric(20,8) not null,
    "timestamp" timestamp without time zone default now(),
    "source" character varying(50) default 'binance'::character varying
      );



  create table "public"."yellowperps_trades" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "position_id" uuid,
    "symbol" character varying(20) not null,
    "side" character varying(10) not null,
    "size" numeric(20,8) not null,
    "price" numeric(20,8) not null,
    "fee_btc" numeric(20,6) default 0,
    "realized_pnl" numeric(20,6) default 0,
    "trade_type" character varying(20),
    "executed_at" timestamp without time zone default now()
      );



  create table "public"."yellowperps_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" character varying(42) not null,
    "transaction_hash" character varying(66),
    "transaction_id" character varying(255),
    "chain" character varying(20) not null,
    "status" character varying(10) not null,
    "description" text not null,
    "value" character varying(78),
    "token_symbol" character varying(10),
    "gas_used" character varying(78),
    "gas_price" character varying(78),
    "timestamp" timestamp with time zone not null default now(),
    "block_number" bigint,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."yellowperps_users" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_address" character varying(42) not null,
    "user_level" integer default 1,
    "total_profit_cbtc" numeric(20,6) default 0,
    "total_volume_cbtc" numeric(20,6) default 0,
    "total_deposits_cbtc" numeric(20,6) default 0,
    "channel_id" character varying(66),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter sequence "public"."tangentx_market_stats_id_seq" owned by "public"."tangentx_market_stats"."id";

alter sequence "public"."tangentx_markets_id_seq" owned by "public"."tangentx_markets"."id";

alter sequence "public"."velox_bid_transactions_id_seq" owned by "public"."velox_bid_transactions"."id";

alter sequence "public"."velox_maker_transactions_id_seq" owned by "public"."velox_maker_transactions"."id";

alter sequence "public"."velox_taker_transactions_id_seq" owned by "public"."velox_taker_transactions"."id";

CREATE UNIQUE INDEX agent_actions_pkey ON public.agent_actions USING btree (id);

CREATE UNIQUE INDEX agent_chats_pkey ON public.agent_chats USING btree (id);

CREATE UNIQUE INDEX agent_conversations_pkey ON public.agent_conversations USING btree (id);

CREATE UNIQUE INDEX agent_pay_api_keys_pkey ON public.agent_pay_api_keys USING btree (id);

CREATE UNIQUE INDEX agent_pay_services_pkey ON public.agent_pay_services USING btree (id);

CREATE UNIQUE INDEX agent_pay_usage_pkey ON public.agent_pay_usage USING btree (id);

CREATE UNIQUE INDEX agents_name_key ON public.agents USING btree (name);

CREATE UNIQUE INDEX agents_pkey ON public.agents USING btree (id);

CREATE UNIQUE INDEX animoca_credential_schemas_new_pkey ON public.animoca_credential_schemas USING btree (id);

CREATE UNIQUE INDEX animoca_credentials_new_pkey ON public.animoca_credentials USING btree (id);

CREATE UNIQUE INDEX animoca_credentials_new_token_address_key ON public.animoca_credentials USING btree (token_address);

CREATE INDEX animoca_idx_credential_schemas_type ON public.animoca_credential_schemas USING btree (credential_type);

CREATE INDEX animoca_idx_credentials_category ON public.animoca_credentials USING btree (category);

CREATE INDEX animoca_idx_credentials_issued_at ON public.animoca_credentials USING btree (issued_at DESC);

CREATE INDEX animoca_idx_credentials_owner ON public.animoca_credentials USING btree (owner_address);

CREATE INDEX animoca_idx_credentials_schema ON public.animoca_credentials USING btree (credential_schema_id);

CREATE INDEX animoca_idx_credentials_token_address ON public.animoca_credentials USING btree (token_address);

CREATE INDEX animoca_idx_influencers_joined_date ON public.animoca_influencers USING btree (joined_date DESC);

CREATE INDEX animoca_idx_influencers_reputation ON public.animoca_influencers USING btree (reputation_score DESC);

CREATE INDEX animoca_idx_influencers_token_address ON public.animoca_influencers USING btree (token_address);

CREATE INDEX animoca_idx_trades_created_at ON public.animoca_trades USING btree (created_at DESC);

CREATE INDEX animoca_idx_trades_is_buy ON public.animoca_trades USING btree (is_buy);

CREATE INDEX animoca_idx_trades_token_address ON public.animoca_trades USING btree (token_address);

CREATE INDEX animoca_idx_trades_trader_address ON public.animoca_trades USING btree (trader_address);

CREATE UNIQUE INDEX animoca_influencers_new_pkey ON public.animoca_influencers USING btree (wallet_address);

CREATE UNIQUE INDEX animoca_influencers_new_token_address_key ON public.animoca_influencers USING btree (token_address);

CREATE UNIQUE INDEX animoca_trades_pkey ON public.animoca_trades USING btree (tx_hash);

CREATE UNIQUE INDEX businesses_pkey ON public.businesses USING btree (id);

CREATE UNIQUE INDEX businesses_slug_key ON public.businesses USING btree (slug);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE UNIQUE INDEX comm_styles_pkey ON public.comm_styles USING btree (id);

CREATE UNIQUE INDEX commands_pkey ON public.commands USING btree (id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX dxykaia_funding_history_pkey ON public.dxyperps_funding_history USING btree (id);

CREATE UNIQUE INDEX dxykaia_liquidations_pkey ON public.dxyperps_liquidations USING btree (id);

CREATE UNIQUE INDEX dxykaia_markets_pkey ON public.dxyperps_markets USING btree (id);

CREATE UNIQUE INDEX dxykaia_orders_pkey ON public.dxyperps_orders USING btree (id);

CREATE UNIQUE INDEX dxykaia_position_history_pkey ON public.dxyperps_position_history USING btree (id);

CREATE UNIQUE INDEX dxykaia_positions_pkey ON public.dxyperps_positions USING btree (id);

CREATE UNIQUE INDEX dxykaia_price_snapshots_pkey ON public.dxyperps_price_snapshots USING btree (id);

CREATE UNIQUE INDEX dxykaia_traders_pkey ON public.dxyperps_traders USING btree (id);

CREATE UNIQUE INDEX dxyperps_markets_symbol_chain_id_key ON public.dxyperps_markets USING btree (symbol, chain_id);

CREATE UNIQUE INDEX dxyperps_markets_symbol_chain_unique ON public.dxyperps_markets USING btree (symbol, chain_id);

CREATE UNIQUE INDEX dxyperps_price_snapshots_unique ON public.dxyperps_price_snapshots USING btree (market_id, chain_id, timeframe, "timestamp");

CREATE UNIQUE INDEX dxyperps_traders_wallet_address_chain_id_key ON public.dxyperps_traders USING btree (wallet_address, chain_id);

CREATE UNIQUE INDEX dxyperps_traders_wallet_chain_unique ON public.dxyperps_traders USING btree (wallet_address, chain_id);

CREATE UNIQUE INDEX ember_chat_messages_pkey ON public.ember_chat_messages USING btree (id);

CREATE UNIQUE INDEX ember_order_details_pkey ON public.ember_order_details USING btree (id);

CREATE UNIQUE INDEX ember_order_details_tx_hash_key ON public.ember_order_details USING btree (tx_hash);

CREATE UNIQUE INDEX ember_streams_pkey ON public.ember_streams USING btree (id);

CREATE UNIQUE INDEX frameworks_pkey ON public.frameworks USING btree (id);

CREATE UNIQUE INDEX hackathons_pkey ON public.hackathons USING btree (id);

CREATE INDEX idx_agent_actions_agent_id ON public.agent_actions USING btree (agent_id);

CREATE INDEX idx_agent_actions_recurring ON public.agent_actions USING btree (is_recurring);

CREATE INDEX idx_agent_actions_status ON public.agent_actions USING btree (status);

CREATE INDEX idx_agent_chats_conversation_id ON public.agent_chats USING btree (conversation_id);

CREATE INDEX idx_agent_conversations_agent_profile ON public.agent_conversations USING btree (agent_id, profile_id);

CREATE INDEX idx_agent_pay_api_keys_hash ON public.agent_pay_api_keys USING btree (key_hash);

CREATE INDEX idx_agent_pay_api_keys_owner ON public.agent_pay_api_keys USING btree (owner_address);

CREATE INDEX idx_agent_pay_services_active ON public.agent_pay_services USING btree (is_active);

CREATE INDEX idx_agent_pay_services_category ON public.agent_pay_services USING btree (category);

CREATE INDEX idx_agent_pay_services_owner ON public.agent_pay_services USING btree (owner_address);

CREATE INDEX idx_agent_pay_usage_owner ON public.agent_pay_usage USING btree (owner_address);

CREATE INDEX idx_agent_pay_usage_payer ON public.agent_pay_usage USING btree (payer_address);

CREATE INDEX idx_agent_pay_usage_service ON public.agent_pay_usage USING btree (service_id);

CREATE INDEX idx_agent_pay_usage_timestamp ON public.agent_pay_usage USING btree (request_timestamp);

CREATE INDEX idx_applications_status ON public.salvation_project_applications USING btree (status);

CREATE INDEX idx_applications_wallet ON public.salvation_project_applications USING btree (wallet_address);

CREATE INDEX idx_chats_conversation_id ON public.chats USING btree (conversation_id);

CREATE INDEX idx_chats_message_type ON public.chats USING btree (message_type);

CREATE INDEX idx_chats_requires_action ON public.chats USING btree (requires_action) WHERE (requires_action = true);

CREATE INDEX idx_chats_sender ON public.chats USING btree (sender);

CREATE INDEX idx_consensus_chain ON public.mocat_ai_consensus_records USING btree (chain_id);

CREATE INDEX idx_consensus_cluster ON public.mocat_ai_consensus_records USING btree (cluster_id);

CREATE INDEX idx_consensus_created ON public.mocat_ai_consensus_records USING btree (created_at DESC);

CREATE INDEX idx_consensus_decision ON public.mocat_ai_consensus_records USING btree (consensus_decision);

CREATE INDEX idx_consensus_execution ON public.mocat_ai_consensus_records USING btree (execution_decision);

CREATE INDEX idx_consensus_orchestration ON public.mocat_ai_consensus_records USING btree (orchestration_id);

CREATE INDEX idx_consensus_signal ON public.mocat_ai_consensus_records USING btree (signal_id);

CREATE INDEX idx_consensus_user ON public.mocat_ai_consensus_records USING btree (user_id);

CREATE INDEX idx_conversations_agent_id ON public.conversations USING btree (agent_id);

CREATE INDEX idx_conversations_application_id ON public.salvation_conversations USING btree (application_id);

CREATE INDEX idx_conversations_project_id ON public.conversations USING btree (project_id);

CREATE INDEX idx_conversations_status ON public.conversations USING btree (status);

CREATE INDEX idx_dxyperps_funding_chain ON public.dxyperps_funding_history USING btree (chain_id);

CREATE INDEX idx_dxyperps_funding_market_time ON public.dxyperps_funding_history USING btree (market_id, funding_time);

CREATE INDEX idx_dxyperps_history_chain ON public.dxyperps_position_history USING btree (chain_id);

CREATE INDEX idx_dxyperps_history_closed ON public.dxyperps_position_history USING btree (closed_at);

CREATE INDEX idx_dxyperps_history_market ON public.dxyperps_position_history USING btree (market_id);

CREATE INDEX idx_dxyperps_history_trader_time ON public.dxyperps_position_history USING btree (trader_id, closed_at DESC);

CREATE INDEX idx_dxyperps_liquidations_chain ON public.dxyperps_liquidations USING btree (chain_id);

CREATE INDEX idx_dxyperps_liquidations_time ON public.dxyperps_liquidations USING btree (liquidated_at);

CREATE INDEX idx_dxyperps_liquidations_trader ON public.dxyperps_liquidations USING btree (trader_id);

CREATE INDEX idx_dxyperps_markets_chain ON public.dxyperps_markets USING btree (chain_id);

CREATE INDEX idx_dxyperps_markets_symbol_chain ON public.dxyperps_markets USING btree (symbol, chain_id);

CREATE INDEX idx_dxyperps_orders_chain ON public.dxyperps_orders USING btree (chain_id);

CREATE INDEX idx_dxyperps_orders_created ON public.dxyperps_orders USING btree (created_at);

CREATE INDEX idx_dxyperps_orders_market ON public.dxyperps_orders USING btree (market_id);

CREATE INDEX idx_dxyperps_orders_status ON public.dxyperps_orders USING btree (status);

CREATE INDEX idx_dxyperps_orders_trader_time ON public.dxyperps_orders USING btree (trader_id, created_at DESC);

CREATE INDEX idx_dxyperps_positions_chain ON public.dxyperps_positions USING btree (chain_id);

CREATE INDEX idx_dxyperps_positions_liquidation ON public.dxyperps_positions USING btree (margin_ratio) WHERE ((status)::text = 'OPEN'::text);

CREATE INDEX idx_dxyperps_positions_market ON public.dxyperps_positions USING btree (market_id);

CREATE INDEX idx_dxyperps_positions_status ON public.dxyperps_positions USING btree (status);

CREATE INDEX idx_dxyperps_positions_trader ON public.dxyperps_positions USING btree (trader_id);

CREATE INDEX idx_dxyperps_positions_trader_status ON public.dxyperps_positions USING btree (trader_id, status);

CREATE INDEX idx_dxyperps_price_chain ON public.dxyperps_price_snapshots USING btree (chain_id);

CREATE INDEX idx_dxyperps_price_market_time ON public.dxyperps_price_snapshots USING btree (market_id, "timestamp");

CREATE INDEX idx_dxyperps_traders_chain ON public.dxyperps_traders USING btree (chain_id);

CREATE INDEX idx_dxyperps_traders_pnl ON public.dxyperps_traders USING btree (total_pnl DESC);

CREATE INDEX idx_dxyperps_traders_volume ON public.dxyperps_traders USING btree (total_volume DESC);

CREATE INDEX idx_dxyperps_traders_wallet ON public.dxyperps_traders USING btree (wallet_address);

CREATE INDEX idx_dxyperps_traders_wallet_chain ON public.dxyperps_traders USING btree (wallet_address, chain_id);

CREATE INDEX idx_ember_chat_sender ON public.ember_chat_messages USING btree (sender_address);

CREATE INDEX idx_ember_chat_stream ON public.ember_chat_messages USING btree (stream_id, created_at);

CREATE INDEX idx_ember_chat_type ON public.ember_chat_messages USING btree (message_type);

CREATE INDEX idx_ember_order_details_buyer ON public.ember_order_details USING btree (buyer_address);

CREATE INDEX idx_ember_order_details_seller ON public.ember_order_details USING btree (seller_address);

CREATE INDEX idx_ember_order_details_tx ON public.ember_order_details USING btree (tx_hash);

CREATE INDEX idx_ember_streams_live ON public.ember_streams USING btree (is_live) WHERE (is_live = true);

CREATE INDEX idx_ember_streams_seller ON public.ember_streams USING btree (seller_address);

CREATE INDEX idx_ember_streams_started ON public.ember_streams USING btree (started_at DESC);

CREATE INDEX idx_file_registry_chain ON public.urejesho_file_registry USING btree (chain);

CREATE INDEX idx_file_registry_content_hash ON public.urejesho_file_registry USING btree (content_hash);

CREATE INDEX idx_file_registry_created_at ON public.urejesho_file_registry USING btree (created_at DESC);

CREATE INDEX idx_file_registry_hfs_file_id ON public.urejesho_file_registry USING btree (hfs_file_id);

CREATE INDEX idx_file_registry_ipfs_cid ON public.urejesho_file_registry USING btree (ipfs_cid);

CREATE INDEX idx_file_registry_milestone ON public.urejesho_file_registry USING btree (related_milestone_id);

CREATE INDEX idx_file_registry_ngo ON public.urejesho_file_registry USING btree (related_ngo_id);

CREATE INDEX idx_file_registry_owner ON public.urejesho_file_registry USING btree (owner_id, owner_type);

CREATE INDEX idx_file_registry_project ON public.urejesho_file_registry USING btree (related_project_id);

CREATE INDEX idx_file_registry_type ON public.urejesho_file_registry USING btree (file_type);

CREATE INDEX idx_frameworks_active ON public.frameworks USING btree (is_active);

CREATE INDEX idx_frameworks_category ON public.frameworks USING btree (category);

CREATE INDEX idx_labang_chat_stream ON public.labang_chat_messages USING btree (stream_id, created_at DESC);

CREATE INDEX idx_labang_chat_user ON public.labang_chat_messages USING btree (user_address, created_at DESC);

CREATE INDEX idx_liquidity_history_action_type ON public.liquidity_history USING btree (action_type);

CREATE INDEX idx_liquidity_history_timestamp ON public.liquidity_history USING btree ("timestamp" DESC);

CREATE INDEX idx_liquidity_history_transaction_hash ON public.liquidity_history USING btree (transaction_hash);

CREATE INDEX idx_liquidity_history_wallet_address ON public.liquidity_history USING btree (wallet_address);

CREATE INDEX idx_meetings_business_id ON public.meetings USING btree (business_id);

CREATE INDEX idx_meetings_date ON public.meetings USING btree (date);

CREATE INDEX idx_meetings_google_event_id ON public.meetings USING btree (google_event_id);

CREATE INDEX idx_meetings_status ON public.meetings USING btree (status);

CREATE INDEX idx_memories_agent_id ON public.memories USING btree (agent_id);

CREATE INDEX idx_memories_profile_id ON public.memories USING btree (profile_id);

CREATE INDEX idx_memories_type ON public.memories USING btree (memory_type);

CREATE INDEX idx_milestones_workflow_id ON public.milestones USING btree (workflow_id);

CREATE INDEX idx_mocat_ai_agents_active ON public.mocat_ai_ai_agents USING btree (is_active);

CREATE INDEX idx_mocat_ai_agents_developer ON public.mocat_ai_ai_agents USING btree (developer_id);

CREATE INDEX idx_mocat_ai_agents_wins ON public.mocat_ai_ai_agents USING btree (wins);

CREATE INDEX idx_mocat_ai_ai_agents_agent_id ON public.mocat_ai_ai_agents USING btree (agent_id);

CREATE INDEX idx_mocat_ai_ai_agents_chain ON public.mocat_ai_ai_agents USING btree (chain_id);

CREATE INDEX idx_mocat_ai_clusters_active ON public.mocat_ai_clusters USING btree (is_active);

CREATE INDEX idx_mocat_ai_clusters_agents ON public.mocat_ai_clusters USING gin (agent_ids);

CREATE INDEX idx_mocat_ai_clusters_chain ON public.mocat_ai_clusters USING btree (chain_id);

CREATE INDEX idx_mocat_ai_clusters_user ON public.mocat_ai_clusters USING btree (user_id);

CREATE INDEX idx_mocat_ai_copy_expert ON public.mocat_ai_copy_trading USING btree (expert_trader_id);

CREATE INDEX idx_mocat_ai_copy_follower ON public.mocat_ai_copy_trading USING btree (follower_id);

CREATE INDEX idx_mocat_ai_copy_status ON public.mocat_ai_copy_trading USING btree (trade_status);

CREATE INDEX idx_mocat_ai_copy_trading_chain ON public.mocat_ai_copy_trading USING btree (chain_id);

CREATE INDEX idx_mocat_ai_expert_traders_chain ON public.mocat_ai_expert_traders USING btree (chain_id);

CREATE INDEX idx_mocat_ai_expert_traders_reputation ON public.mocat_ai_expert_traders USING btree (reputation_score);

CREATE INDEX idx_mocat_ai_expert_traders_user ON public.mocat_ai_expert_traders USING btree (user_id);

CREATE INDEX idx_mocat_ai_expert_traders_wins ON public.mocat_ai_expert_traders USING btree (wins);

CREATE INDEX idx_mocat_ai_follows_active ON public.mocat_ai_follows USING btree (is_active);

CREATE INDEX idx_mocat_ai_follows_active_combo ON public.mocat_ai_follows USING btree (follower_id, expert_trader_id) WHERE (is_active = true);

CREATE INDEX idx_mocat_ai_follows_chain ON public.mocat_ai_follows USING btree (chain_id);

CREATE INDEX idx_mocat_ai_follows_expert ON public.mocat_ai_follows USING btree (expert_trader_id);

CREATE INDEX idx_mocat_ai_follows_followed_at ON public.mocat_ai_follows USING btree (followed_at);

CREATE INDEX idx_mocat_ai_follows_follower ON public.mocat_ai_follows USING btree (follower_id);

CREATE INDEX idx_mocat_ai_moca_credentials_chain ON public.mocat_ai_moca_credentials USING btree (chain_id);

CREATE INDEX idx_mocat_ai_moca_creds_status ON public.mocat_ai_moca_credentials USING btree (verification_status);

CREATE INDEX idx_mocat_ai_moca_creds_user ON public.mocat_ai_moca_credentials USING btree (user_id);

CREATE INDEX idx_mocat_ai_signal_validations_chain ON public.mocat_ai_signal_validations USING btree (chain_id);

CREATE INDEX idx_mocat_ai_signals_chain ON public.mocat_ai_trading_signals USING btree (chain);

CREATE INDEX idx_mocat_ai_signals_posted ON public.mocat_ai_trading_signals USING btree (posted_at);

CREATE INDEX idx_mocat_ai_signals_status ON public.mocat_ai_trading_signals USING btree (trade_status);

CREATE INDEX idx_mocat_ai_signals_trader ON public.mocat_ai_trading_signals USING btree (expert_trader_id);

CREATE INDEX idx_mocat_ai_trading_signals_chain ON public.mocat_ai_trading_signals USING btree (chain_id);

CREATE INDEX idx_mocat_ai_users_chain ON public.mocat_ai_users USING btree (chain_id);

CREATE INDEX idx_mocat_ai_users_line ON public.mocat_ai_users USING btree (line_user_id);

CREATE INDEX idx_mocat_ai_users_wallet ON public.mocat_ai_users USING btree (wallet_address);

CREATE INDEX idx_mocat_ai_users_wallet_chain ON public.mocat_ai_users USING btree (wallet_address, chain_id);

CREATE INDEX idx_mocat_ai_validations_agent ON public.mocat_ai_signal_validations USING btree (agent_id);

CREATE INDEX idx_mocat_ai_validations_signal ON public.mocat_ai_signal_validations USING btree (signal_id);

CREATE INDEX idx_ngo_credentials_chain ON public.urejesho_ngo_credentials USING btree (chain);

CREATE INDEX idx_ngo_credentials_credential_id ON public.urejesho_ngo_credentials USING btree (credential_id);

CREATE INDEX idx_ngo_credentials_did ON public.urejesho_ngo_credentials USING btree (did);

CREATE INDEX idx_ngo_credentials_expires_at ON public.urejesho_ngo_credentials USING btree (expires_at);

CREATE INDEX idx_ngo_credentials_ngo ON public.urejesho_ngo_credentials USING btree (ngo_id);

CREATE INDEX idx_ngo_credentials_status ON public.urejesho_ngo_credentials USING btree (revoked, suspended);

CREATE INDEX idx_nicknames_owner ON public.konstant_nicknames USING btree (owner_address);

CREATE INDEX idx_nicknames_target ON public.konstant_nicknames USING btree (target_address);

CREATE UNIQUE INDEX idx_playwright_allocations_active_project ON public.playwright_allocations USING btree (project_id) WHERE (status = 'allocated'::text);

CREATE INDEX idx_playwright_allocations_category ON public.playwright_allocations USING btree (category);

CREATE INDEX idx_playwright_allocations_project ON public.playwright_allocations USING btree (project_id);

CREATE INDEX idx_playwright_allocations_session ON public.playwright_allocations USING btree (session_id);

CREATE INDEX idx_playwright_allocations_status ON public.playwright_allocations USING btree (status);

CREATE INDEX idx_positions_opened ON public.yellowperps_positions USING btree (opened_at DESC);

CREATE INDEX idx_price_timestamp ON public.yellowperps_price_feeds USING btree ("timestamp" DESC);

CREATE INDEX idx_profiles_character_id ON public.profiles USING btree (character_id);

CREATE INDEX idx_project_b2b_clients_business_id ON public.project_b2b_clients USING btree (business_id);

CREATE INDEX idx_project_b2b_clients_customer_since ON public.project_b2b_clients USING btree (customer_since DESC);

CREATE INDEX idx_project_b2b_clients_email ON public.project_b2b_clients USING btree (client_email);

CREATE INDEX idx_project_b2b_clients_project_id ON public.project_b2b_clients USING btree (project_id);

CREATE INDEX idx_project_b2b_clients_status ON public.project_b2b_clients USING btree (status);

CREATE INDEX idx_project_network_activity_business_id ON public.project_network_activity USING btree (business_id);

CREATE INDEX idx_project_network_activity_last_updated ON public.project_network_activity USING btree (last_updated DESC);

CREATE INDEX idx_project_network_activity_network ON public.project_network_activity USING btree (network);

CREATE INDEX idx_project_network_activity_project_id ON public.project_network_activity USING btree (project_id);

CREATE INDEX idx_project_onchain_metrics_business_id ON public.project_onchain_metrics USING btree (business_id);

CREATE INDEX idx_project_onchain_metrics_last_updated ON public.project_onchain_metrics USING btree (last_updated DESC);

CREATE INDEX idx_project_onchain_metrics_network ON public.project_onchain_metrics USING btree (network);

CREATE INDEX idx_project_onchain_metrics_project_id ON public.project_onchain_metrics USING btree (project_id);

CREATE INDEX idx_project_onchain_transactions_business_id ON public.project_onchain_transactions USING btree (business_id);

CREATE INDEX idx_project_onchain_transactions_network ON public.project_onchain_transactions USING btree (network);

CREATE INDEX idx_project_onchain_transactions_occurred_at ON public.project_onchain_transactions USING btree (occurred_at DESC);

CREATE INDEX idx_project_onchain_transactions_project_id ON public.project_onchain_transactions USING btree (project_id);

CREATE INDEX idx_project_onchain_transactions_status ON public.project_onchain_transactions USING btree (status);

CREATE INDEX idx_project_onchain_transactions_tx_hash ON public.project_onchain_transactions USING btree (tx_hash);

CREATE INDEX idx_project_social_activities_business_id ON public.project_social_activities USING btree (business_id);

CREATE INDEX idx_project_social_activities_occurred_at ON public.project_social_activities USING btree (occurred_at DESC);

CREATE INDEX idx_project_social_activities_platform ON public.project_social_activities USING btree (platform);

CREATE INDEX idx_project_social_activities_project_id ON public.project_social_activities USING btree (project_id);

CREATE INDEX idx_project_social_metrics_business_id ON public.project_social_metrics USING btree (business_id);

CREATE INDEX idx_project_social_metrics_last_updated ON public.project_social_metrics USING btree (last_updated DESC);

CREATE INDEX idx_project_social_metrics_platform ON public.project_social_metrics USING btree (platform);

CREATE INDEX idx_project_social_metrics_project_id ON public.project_social_metrics USING btree (project_id);

CREATE INDEX idx_project_updates_chain ON public.urejesho_project_updates USING btree (chain);

CREATE INDEX idx_project_updates_created_at ON public.urejesho_project_updates USING btree (created_at DESC);

CREATE INDEX idx_project_updates_milestone ON public.urejesho_project_updates USING btree (related_milestone_id);

CREATE INDEX idx_project_updates_ngo ON public.urejesho_project_updates USING btree (ngo_id);

CREATE INDEX idx_project_updates_project ON public.urejesho_project_updates USING btree (project_id);

CREATE INDEX idx_project_updates_public ON public.urejesho_project_updates USING btree (is_public) WHERE (is_public = true);

CREATE INDEX idx_project_wallets_address ON public.project_wallets USING btree (address);

CREATE INDEX idx_project_wallets_chain ON public.project_wallets USING btree (chain);

CREATE INDEX idx_project_wallets_ecosystem ON public.project_wallets USING btree (ecosystem);

CREATE INDEX idx_project_wallets_project ON public.project_wallets USING btree (project_id);

CREATE INDEX idx_projects_framework_id ON public.projects USING btree (framework_id);

CREATE INDEX idx_projects_status ON public.projects USING btree (status);

CREATE INDEX idx_salvation_ipfs_metadata_cid ON public.salvation_ipfs_metadata USING btree (cid);

CREATE INDEX idx_saved_projects_chain ON public.urejesho_saved_projects USING btree (chain);

CREATE INDEX idx_saved_projects_project ON public.urejesho_saved_projects USING btree (project_id);

CREATE INDEX idx_saved_projects_saved_at ON public.urejesho_saved_projects USING btree (saved_at DESC);

CREATE INDEX idx_saved_projects_user ON public.urejesho_saved_projects USING btree (user_hedera_account_id);

CREATE INDEX idx_sentinel_api_keys_hash ON public.sentinel_api_keys USING btree (key_hash);

CREATE INDEX idx_sentinel_api_keys_wallet ON public.sentinel_api_keys USING btree (wallet_address);

CREATE INDEX idx_sentinel_debugger_runs_created ON public.sentinel_debugger_runs USING btree (created_at DESC);

CREATE INDEX idx_sentinel_debugger_runs_project ON public.sentinel_debugger_runs USING btree (project_id);

CREATE INDEX idx_sentinel_debugger_runs_wallet ON public.sentinel_debugger_runs USING btree (wallet_address);

CREATE INDEX idx_sentinel_gas_analyses_created ON public.sentinel_gas_analyses USING btree (created_at DESC);

CREATE INDEX idx_sentinel_gas_analyses_project ON public.sentinel_gas_analyses USING btree (project_id);

CREATE INDEX idx_sentinel_gas_analyses_wallet ON public.sentinel_gas_analyses USING btree (wallet_address);

CREATE INDEX idx_sentinel_projects_wallet ON public.sentinel_projects USING btree (wallet_address);

CREATE INDEX idx_sentinel_prover_runs_created ON public.sentinel_prover_runs USING btree (created_at DESC);

CREATE INDEX idx_sentinel_prover_runs_project ON public.sentinel_prover_runs USING btree (project_id);

CREATE INDEX idx_sentinel_prover_runs_wallet ON public.sentinel_prover_runs USING btree (wallet_address);

CREATE INDEX idx_sentinel_simulations_created ON public.sentinel_simulations USING btree (created_at DESC);

CREATE INDEX idx_sentinel_simulations_project ON public.sentinel_simulations USING btree (project_id);

CREATE INDEX idx_sentinel_simulations_wallet ON public.sentinel_simulations USING btree (wallet_address);

CREATE INDEX idx_sentinel_team_invites_team ON public.sentinel_team_invites USING btree (team_id);

CREATE INDEX idx_sentinel_team_invites_token ON public.sentinel_team_invites USING btree (invite_token);

CREATE INDEX idx_sentinel_team_members_team ON public.sentinel_team_members USING btree (team_id);

CREATE INDEX idx_sentinel_team_members_wallet ON public.sentinel_team_members USING btree (wallet_address);

CREATE INDEX idx_sentinel_teams_owner ON public.sentinel_teams USING btree (owner_wallet);

CREATE INDEX idx_service_key_audit_account ON public.service_key_audit_log USING btree (hedera_account_id);

CREATE INDEX idx_service_key_audit_timestamp ON public.service_key_audit_log USING btree (created_at DESC);

CREATE INDEX idx_shinroe_users_address ON public.shinroe_users USING btree (lower(address));

CREATE INDEX idx_shinroe_users_display_name ON public.shinroe_users USING btree (display_name);

CREATE INDEX idx_shinroe_users_verychat_id ON public.shinroe_users USING btree (verychat_id) WHERE (verychat_id IS NOT NULL);

CREATE INDEX idx_tangentx_active_markets ON public.tangentx_markets USING btree (id) WHERE (active = true);

CREATE INDEX idx_tangentx_active_positions ON public.tangentx_positions USING btree (user_address) WHERE (status = 'open'::text);

CREATE INDEX idx_tangentx_market_stats_market_date ON public.tangentx_market_stats USING btree (market_id, date);

CREATE INDEX idx_tangentx_market_stats_market_date_desc ON public.tangentx_market_stats USING btree (market_id, date DESC);

CREATE INDEX idx_tangentx_markets_active ON public.tangentx_markets USING btree (active);

CREATE INDEX idx_tangentx_markets_type ON public.tangentx_markets USING btree (credential_type);

CREATE INDEX idx_tangentx_positions_created ON public.tangentx_positions USING btree (created_at);

CREATE INDEX idx_tangentx_positions_market ON public.tangentx_positions USING btree (market_id);

CREATE INDEX idx_tangentx_positions_status ON public.tangentx_positions USING btree (status);

CREATE INDEX idx_tangentx_positions_user ON public.tangentx_positions USING btree (user_address);

CREATE INDEX idx_tangentx_positions_user_status ON public.tangentx_positions USING btree (user_address, status);

CREATE INDEX idx_tangentx_trades_action ON public.tangentx_trades USING btree (action);

CREATE INDEX idx_tangentx_trades_position ON public.tangentx_trades USING btree (position_id);

CREATE INDEX idx_tangentx_trades_position_timestamp ON public.tangentx_trades USING btree (position_id, "timestamp" DESC);

CREATE INDEX idx_tangentx_trades_timestamp ON public.tangentx_trades USING btree ("timestamp");

CREATE INDEX idx_tangentx_users_address ON public.tangentx_users USING btree (address);

CREATE INDEX idx_tangentx_users_referral ON public.tangentx_users USING btree (referral_code);

CREATE INDEX idx_task_dependencies_depends_on ON public.task_dependencies USING btree (depends_on_task_id);

CREATE INDEX idx_task_dependencies_task_id ON public.task_dependencies USING btree (task_id);

CREATE INDEX idx_tasks_milestone_id ON public.tasks USING btree (milestone_id);

CREATE INDEX idx_testnet_transactions_network ON public.testnet_transactions USING btree (network);

CREATE INDEX idx_testnet_wallets_chain ON public.testnet_wallets USING btree (chain);

CREATE INDEX idx_trades_user ON public.yellowperps_trades USING btree (user_id, executed_at DESC);

CREATE INDEX idx_transactions_network ON public.transactions USING btree (network);

CREATE INDEX idx_urejesho_ai_proposals_chain ON public.urejesho_ai_proposals USING btree (chain);

CREATE INDEX idx_urejesho_ai_proposals_project ON public.urejesho_ai_proposals USING btree (project_id);

CREATE INDEX idx_urejesho_ai_proposals_status ON public.urejesho_ai_proposals USING btree (status);

CREATE INDEX idx_urejesho_ai_verifications_chain ON public.urejesho_ai_verifications USING btree (chain);

CREATE INDEX idx_urejesho_ai_verifications_milestone ON public.urejesho_ai_verifications USING btree (milestone_id);

CREATE INDEX idx_urejesho_ai_verifications_requires_review ON public.urejesho_ai_verifications USING btree (requires_human_review);

CREATE INDEX idx_urejesho_donations_category ON public.urejesho_donations USING btree (category);

CREATE INDEX idx_urejesho_donations_chain ON public.urejesho_donations USING btree (chain);

CREATE INDEX idx_urejesho_donations_hedera_account ON public.urejesho_donations USING btree (user_hedera_account_id);

CREATE INDEX idx_urejesho_donations_status ON public.urejesho_donations USING btree (status);

CREATE INDEX idx_urejesho_donations_timestamp ON public.urejesho_donations USING btree (consensus_timestamp);

CREATE INDEX idx_urejesho_donations_user ON public.urejesho_donations USING btree (user_id);

CREATE INDEX idx_urejesho_global_pool_config_chain ON public.urejesho_global_pool_config USING btree (chain);

CREATE INDEX idx_urejesho_impact_badges_chain ON public.urejesho_impact_badges USING btree (chain);

CREATE INDEX idx_urejesho_impact_badges_tier ON public.urejesho_impact_badges USING btree (tier);

CREATE INDEX idx_urejesho_impact_badges_user ON public.urejesho_impact_badges USING btree (user_id);

CREATE INDEX idx_urejesho_milestones_chain ON public.urejesho_milestones USING btree (chain);

CREATE INDEX idx_urejesho_milestones_project ON public.urejesho_milestones USING btree (project_id);

CREATE INDEX idx_urejesho_milestones_requires_review ON public.urejesho_milestones USING btree (requires_human_review);

CREATE INDEX idx_urejesho_milestones_status ON public.urejesho_milestones USING btree (status);

CREATE INDEX idx_urejesho_ngos_chain ON public.urejesho_ngos USING btree (chain);

CREATE INDEX idx_urejesho_ngos_city ON public.urejesho_ngos USING btree (city);

CREATE INDEX idx_urejesho_ngos_country ON public.urejesho_ngos USING btree (country);

CREATE INDEX idx_urejesho_ngos_hedera_account ON public.urejesho_ngos USING btree (hedera_account_id);

CREATE INDEX idx_urejesho_ngos_type ON public.urejesho_ngos USING btree (type);

CREATE INDEX idx_urejesho_ngos_verification_status ON public.urejesho_ngos USING btree (verification_status);

CREATE INDEX idx_urejesho_ngos_year_established ON public.urejesho_ngos USING btree (year_established);

CREATE INDEX idx_urejesho_projects_category ON public.urejesho_projects USING btree (category);

CREATE INDEX idx_urejesho_projects_chain ON public.urejesho_projects USING btree (chain);

CREATE INDEX idx_urejesho_projects_country ON public.urejesho_projects USING btree (country);

CREATE INDEX idx_urejesho_projects_hfs_file ON public.urejesho_projects USING btree (hfs_file_id);

CREATE INDEX idx_urejesho_projects_location ON public.urejesho_projects USING gist (location);

CREATE INDEX idx_urejesho_projects_ngo ON public.urejesho_projects USING btree (ngo_id);

CREATE INDEX idx_urejesho_projects_status ON public.urejesho_projects USING btree (status);

CREATE INDEX idx_urejesho_satellite_imagery_chain ON public.urejesho_satellite_imagery USING btree (chain);

CREATE INDEX idx_urejesho_satellite_imagery_milestone ON public.urejesho_satellite_imagery USING btree (milestone_id);

CREATE INDEX idx_urejesho_satellite_imagery_project ON public.urejesho_satellite_imagery USING btree (project_id);

CREATE INDEX idx_urejesho_users_chain ON public.urejesho_users USING btree (chain);

CREATE INDEX idx_urejesho_users_country ON public.urejesho_users USING btree (country);

CREATE INDEX idx_urejesho_users_did ON public.urejesho_users USING btree (did);

CREATE INDEX idx_urejesho_users_hedera_account ON public.urejesho_users USING btree (hedera_account_id);

CREATE INDEX idx_urejesho_vault_fee_accounts_is_active ON public.urejesho_vault_fee_accounts USING btree (is_active);

CREATE INDEX idx_urejesho_vault_fee_accounts_monthly_enabled ON public.urejesho_vault_fee_accounts USING btree (monthly_enabled);

CREATE INDEX idx_urejesho_vault_fee_accounts_per_tx_enabled ON public.urejesho_vault_fee_accounts USING btree (per_transaction_enabled);

CREATE INDEX idx_urejesho_vault_fee_accounts_threshold_enabled ON public.urejesho_vault_fee_accounts USING btree (threshold_key_enabled);

CREATE INDEX idx_urejesho_vault_fee_accounts_user_id ON public.urejesho_vault_fee_accounts USING btree (user_id);

CREATE INDEX idx_urejesho_vault_fee_monitoring_is_monitoring ON public.urejesho_vault_fee_monitoring_state USING btree (is_monitoring);

CREATE INDEX idx_urejesho_vault_fee_monthly_schedule_account ON public.urejesho_vault_fee_monthly_schedule USING btree (hedera_account_id);

CREATE INDEX idx_urejesho_vault_fee_monthly_schedule_date ON public.urejesho_vault_fee_monthly_schedule USING btree (scheduled_date);

CREATE INDEX idx_urejesho_vault_fee_monthly_schedule_status ON public.urejesho_vault_fee_monthly_schedule USING btree (status);

CREATE INDEX idx_urejesho_vault_fee_transactions_account ON public.urejesho_vault_fee_transactions USING btree (hedera_account_id);

CREATE INDEX idx_urejesho_vault_fee_transactions_created ON public.urejesho_vault_fee_transactions USING btree (created_at DESC);

CREATE INDEX idx_urejesho_vault_fee_transactions_hedera_tx ON public.urejesho_vault_fee_transactions USING btree (hedera_transaction_id);

CREATE INDEX idx_urejesho_vault_fee_transactions_status ON public.urejesho_vault_fee_transactions USING btree (status);

CREATE INDEX idx_urejesho_vault_fee_transactions_type ON public.urejesho_vault_fee_transactions USING btree (collection_type);

CREATE INDEX idx_urejesho_votes_chain ON public.urejesho_votes USING btree (chain);

CREATE INDEX idx_urejesho_votes_proposal ON public.urejesho_votes USING btree (proposal_id);

CREATE INDEX idx_urejesho_votes_user ON public.urejesho_votes USING btree (user_id);

CREATE INDEX idx_urejesho_votes_voter_account ON public.urejesho_votes USING btree (voter_account_id);

CREATE INDEX idx_urejesho_voting_proposals_chain ON public.urejesho_voting_proposals USING btree (chain);

CREATE INDEX idx_urejesho_voting_proposals_dates ON public.urejesho_voting_proposals USING btree (start_date, end_date);

CREATE INDEX idx_urejesho_voting_proposals_project ON public.urejesho_voting_proposals USING btree (project_id);

CREATE INDEX idx_urejesho_voting_proposals_status ON public.urejesho_voting_proposals USING btree (status);

CREATE INDEX idx_vault_fee_accounts_active ON public.vault_fee_accounts USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_vault_fee_accounts_hedera_id ON public.vault_fee_accounts USING btree (hedera_account_id);

CREATE INDEX idx_vault_fee_accounts_threshold_enabled ON public.vault_fee_accounts USING btree (threshold_key_enabled) WHERE (threshold_key_enabled = true);

CREATE INDEX idx_vault_fee_accounts_user_id ON public.vault_fee_accounts USING btree (user_id);

CREATE INDEX idx_vault_fee_transactions_account ON public.vault_fee_transactions USING btree (hedera_account_id);

CREATE INDEX idx_vault_fee_transactions_status ON public.vault_fee_transactions USING btree (status);

CREATE INDEX idx_vault_fee_transactions_timestamp ON public.vault_fee_transactions USING btree (consensus_timestamp DESC);

CREATE INDEX idx_velox_bid_transactions_intent_id ON public.velox_bid_transactions USING btree (intent_id);

CREATE INDEX idx_velox_bid_transactions_solver ON public.velox_bid_transactions USING btree (solver_address);

CREATE INDEX idx_velox_maker_intent_id ON public.velox_maker_transactions USING btree (intent_id);

CREATE INDEX idx_velox_maker_user_address ON public.velox_maker_transactions USING btree (user_address);

CREATE INDEX idx_velox_taker_intent_id ON public.velox_taker_transactions USING btree (intent_id);

CREATE INDEX idx_velox_taker_solver_address ON public.velox_taker_transactions USING btree (solver_address);

CREATE INDEX idx_wallets_chain ON public.wallets USING btree (chain);

CREATE INDEX idx_wallets_doxxed ON public.wallets USING btree (doxxed);

CREATE INDEX idx_workflows_project_id ON public.workflows USING btree (project_id);

CREATE INDEX idx_yellowperps_transactions_chain ON public.yellowperps_transactions USING btree (chain);

CREATE INDEX idx_yellowperps_transactions_status ON public.yellowperps_transactions USING btree (status);

CREATE INDEX idx_yellowperps_transactions_timestamp ON public.yellowperps_transactions USING btree ("timestamp" DESC);

CREATE INDEX idx_yellowperps_transactions_transaction_hash ON public.yellowperps_transactions USING btree (transaction_hash);

CREATE INDEX idx_yellowperps_transactions_wallet_address ON public.yellowperps_transactions USING btree (wallet_address);

CREATE UNIQUE INDEX konstant_nicknames_owner_address_target_address_key ON public.konstant_nicknames USING btree (owner_address, target_address);

CREATE UNIQUE INDEX konstant_nicknames_pkey ON public.konstant_nicknames USING btree (id);

CREATE UNIQUE INDEX konstant_profiles_pkey ON public.konstant_profiles USING btree (wallet_address);

CREATE UNIQUE INDEX labang_chat_messages_pkey ON public.labang_chat_messages USING btree (id);

CREATE UNIQUE INDEX labang_daily_earnings_pkey ON public.labang_daily_earnings USING btree (id);

CREATE UNIQUE INDEX labang_daily_earnings_user_address_date_key ON public.labang_daily_earnings USING btree (user_address, date);

CREATE INDEX labang_idx_daily_earnings_date ON public.labang_daily_earnings USING btree (date);

CREATE INDEX labang_idx_daily_earnings_user ON public.labang_daily_earnings USING btree (user_address);

CREATE INDEX labang_idx_orders_buyer ON public.labang_orders USING btree (buyer_address);

CREATE INDEX labang_idx_orders_seller ON public.labang_orders USING btree (seller_id);

CREATE INDEX labang_idx_orders_status ON public.labang_orders USING btree (status);

CREATE INDEX labang_idx_orders_stream ON public.labang_orders USING btree (stream_id);

CREATE INDEX labang_idx_products_active ON public.labang_products USING btree (is_active);

CREATE INDEX labang_idx_products_category ON public.labang_products USING btree (category);

CREATE INDEX labang_idx_products_seller ON public.labang_products USING btree (seller_id);

CREATE INDEX labang_idx_reviews_buyer ON public.labang_reviews USING btree (buyer_address);

CREATE INDEX labang_idx_reviews_order ON public.labang_reviews USING btree (order_id);

CREATE INDEX labang_idx_reviews_product ON public.labang_reviews USING btree (product_id);

CREATE INDEX labang_idx_rewards_claimed ON public.labang_rewards USING btree (claimed);

CREATE INDEX labang_idx_rewards_type ON public.labang_rewards USING btree (reward_type);

CREATE INDEX labang_idx_rewards_user ON public.labang_rewards USING btree (user_address);

CREATE INDEX labang_idx_sellers_approved ON public.labang_sellers USING btree (is_approved);

CREATE INDEX labang_idx_sellers_category ON public.labang_sellers USING btree (category);

CREATE INDEX labang_idx_sellers_wallet ON public.labang_sellers USING btree (wallet_address);

CREATE INDEX labang_idx_stream_products_product ON public.labang_stream_products USING btree (product_id);

CREATE INDEX labang_idx_stream_products_stream ON public.labang_stream_products USING btree (stream_id);

CREATE INDEX labang_idx_streams_scheduled ON public.labang_streams USING btree (scheduled_at);

CREATE INDEX labang_idx_streams_seller ON public.labang_streams USING btree (seller_id);

CREATE INDEX labang_idx_streams_status ON public.labang_streams USING btree (status);

CREATE INDEX labang_idx_streams_youtube ON public.labang_streams USING btree (youtube_url) WHERE (youtube_url IS NOT NULL);

CREATE INDEX labang_idx_watch_sessions_active ON public.labang_watch_sessions USING btree (is_active);

CREATE INDEX labang_idx_watch_sessions_stream ON public.labang_watch_sessions USING btree (stream_id);

CREATE INDEX labang_idx_watch_sessions_user ON public.labang_watch_sessions USING btree (user_address);

CREATE UNIQUE INDEX labang_orders_onchain_order_id_key ON public.labang_orders USING btree (onchain_order_id);

CREATE UNIQUE INDEX labang_orders_pkey ON public.labang_orders USING btree (id);

CREATE UNIQUE INDEX labang_products_pkey ON public.labang_products USING btree (id);

CREATE UNIQUE INDEX labang_reviews_onchain_review_id_key ON public.labang_reviews USING btree (onchain_review_id);

CREATE UNIQUE INDEX labang_reviews_pkey ON public.labang_reviews USING btree (id);

CREATE UNIQUE INDEX labang_rewards_pkey ON public.labang_rewards USING btree (id);

CREATE UNIQUE INDEX labang_sellers_pkey ON public.labang_sellers USING btree (id);

CREATE UNIQUE INDEX labang_sellers_wallet_address_key ON public.labang_sellers USING btree (wallet_address);

CREATE UNIQUE INDEX labang_stream_products_pkey ON public.labang_stream_products USING btree (id);

CREATE UNIQUE INDEX labang_stream_products_stream_id_product_id_key ON public.labang_stream_products USING btree (stream_id, product_id);

CREATE UNIQUE INDEX labang_streams_pkey ON public.labang_streams USING btree (id);

CREATE UNIQUE INDEX labang_streams_stream_key_key ON public.labang_streams USING btree (stream_key);

CREATE UNIQUE INDEX labang_watch_sessions_pkey ON public.labang_watch_sessions USING btree (id);

CREATE UNIQUE INDEX liquidity_history_pkey ON public.liquidity_history USING btree (id);

CREATE UNIQUE INDEX meetings_google_event_id_key ON public.meetings USING btree (google_event_id);

CREATE UNIQUE INDEX meetings_pkey ON public.meetings USING btree (id);

CREATE UNIQUE INDEX memories_pkey ON public.memories USING btree (id);

CREATE UNIQUE INDEX milestones_pkey ON public.milestones USING btree (id);

CREATE UNIQUE INDEX mocat_ai_ai_agents_agent_id_key ON public.mocat_ai_ai_agents USING btree (agent_id);

CREATE UNIQUE INDEX mocat_ai_ai_agents_pkey ON public.mocat_ai_ai_agents USING btree (id);

CREATE UNIQUE INDEX mocat_ai_clusters_pkey ON public.mocat_ai_clusters USING btree (id);

CREATE UNIQUE INDEX mocat_ai_consensus_records_orchestration_id_key ON public.mocat_ai_consensus_records USING btree (orchestration_id);

CREATE UNIQUE INDEX mocat_ai_consensus_records_pkey ON public.mocat_ai_consensus_records USING btree (id);

CREATE UNIQUE INDEX mocat_ai_copy_trading_pkey ON public.mocat_ai_copy_trading USING btree (id);

CREATE UNIQUE INDEX mocat_ai_expert_traders_pkey ON public.mocat_ai_expert_traders USING btree (id);

CREATE UNIQUE INDEX mocat_ai_follows_pkey ON public.mocat_ai_follows USING btree (id);

CREATE UNIQUE INDEX mocat_ai_moca_credentials_pkey ON public.mocat_ai_moca_credentials USING btree (id);

CREATE UNIQUE INDEX mocat_ai_signal_validations_pkey ON public.mocat_ai_signal_validations USING btree (id);

CREATE UNIQUE INDEX mocat_ai_trading_signals_pkey ON public.mocat_ai_trading_signals USING btree (id);

CREATE UNIQUE INDEX mocat_ai_users_pkey ON public.mocat_ai_users USING btree (id);

CREATE UNIQUE INDEX mocat_ai_users_smart_account_chain_unique ON public.mocat_ai_users USING btree (smart_account_address, chain_id);

CREATE UNIQUE INDEX mocat_ai_users_wallet_chain_unique ON public.mocat_ai_users USING btree (wallet_address, chain_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX playwright_allocations_pkey ON public.playwright_allocations USING btree (id);

CREATE UNIQUE INDEX playwright_allocations_port_key ON public.playwright_allocations USING btree (port);

CREATE UNIQUE INDEX playwright_allocations_server_id_key ON public.playwright_allocations USING btree (server_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX project_b2b_clients_pkey ON public.project_b2b_clients USING btree (id);

CREATE UNIQUE INDEX project_network_activity_pkey ON public.project_network_activity USING btree (id);

CREATE UNIQUE INDEX project_network_activity_project_id_network_key ON public.project_network_activity USING btree (project_id, network);

CREATE UNIQUE INDEX project_onchain_metrics_pkey ON public.project_onchain_metrics USING btree (id);

CREATE UNIQUE INDEX project_onchain_metrics_project_id_network_key ON public.project_onchain_metrics USING btree (project_id, network);

CREATE UNIQUE INDEX project_onchain_transactions_pkey ON public.project_onchain_transactions USING btree (id);

CREATE UNIQUE INDEX project_social_activities_pkey ON public.project_social_activities USING btree (id);

CREATE UNIQUE INDEX project_social_metrics_pkey ON public.project_social_metrics USING btree (id);

CREATE UNIQUE INDEX project_social_metrics_project_id_platform_key ON public.project_social_metrics USING btree (project_id, platform);

CREATE UNIQUE INDEX project_wallets_pkey ON public.project_wallets USING btree (id);

CREATE UNIQUE INDEX project_wallets_project_id_chain_key ON public.project_wallets USING btree (project_id, chain);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX salvation_businesses_pkey ON public.salvation_businesses USING btree (wallet_address);

CREATE UNIQUE INDEX salvation_conversations_pkey ON public.salvation_conversations USING btree (id);

CREATE UNIQUE INDEX salvation_ipfs_metadata_cid_key ON public.salvation_ipfs_metadata USING btree (cid);

CREATE UNIQUE INDEX salvation_ipfs_metadata_pkey ON public.salvation_ipfs_metadata USING btree (id);

CREATE UNIQUE INDEX salvation_project_applications_pkey ON public.salvation_project_applications USING btree (id);

CREATE UNIQUE INDEX sentinel_api_keys_key_hash_key ON public.sentinel_api_keys USING btree (key_hash);

CREATE UNIQUE INDEX sentinel_api_keys_pkey ON public.sentinel_api_keys USING btree (id);

CREATE UNIQUE INDEX sentinel_debugger_runs_pkey ON public.sentinel_debugger_runs USING btree (id);

CREATE UNIQUE INDEX sentinel_gas_analyses_pkey ON public.sentinel_gas_analyses USING btree (id);

CREATE UNIQUE INDEX sentinel_projects_pkey ON public.sentinel_projects USING btree (id);

CREATE UNIQUE INDEX sentinel_prover_runs_pkey ON public.sentinel_prover_runs USING btree (id);

CREATE UNIQUE INDEX sentinel_simulations_pkey ON public.sentinel_simulations USING btree (id);

CREATE UNIQUE INDEX sentinel_team_invites_invite_token_key ON public.sentinel_team_invites USING btree (invite_token);

CREATE UNIQUE INDEX sentinel_team_invites_pkey ON public.sentinel_team_invites USING btree (id);

CREATE UNIQUE INDEX sentinel_team_members_pkey ON public.sentinel_team_members USING btree (id);

CREATE UNIQUE INDEX sentinel_team_members_team_id_wallet_address_key ON public.sentinel_team_members USING btree (team_id, wallet_address);

CREATE UNIQUE INDEX sentinel_teams_pkey ON public.sentinel_teams USING btree (id);

CREATE UNIQUE INDEX sentinel_users_pkey ON public.sentinel_users USING btree (wallet_address);

CREATE UNIQUE INDEX service_key_audit_log_pkey ON public.service_key_audit_log USING btree (id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE UNIQUE INDEX sessions_session_identifier_key ON public.sessions USING btree (session_identifier);

CREATE UNIQUE INDEX shinroe_users_address_key ON public.shinroe_users USING btree (address);

CREATE UNIQUE INDEX shinroe_users_pkey ON public.shinroe_users USING btree (id);

CREATE UNIQUE INDEX tangentx_market_stats_market_id_date_key ON public.tangentx_market_stats USING btree (market_id, date);

CREATE UNIQUE INDEX tangentx_market_stats_pkey ON public.tangentx_market_stats USING btree (id);

CREATE UNIQUE INDEX tangentx_markets_credential_type_key ON public.tangentx_markets USING btree (credential_type);

CREATE UNIQUE INDEX tangentx_markets_pkey ON public.tangentx_markets USING btree (id);

CREATE UNIQUE INDEX tangentx_positions_pkey ON public.tangentx_positions USING btree (id);

CREATE UNIQUE INDEX tangentx_trades_pkey ON public.tangentx_trades USING btree (id);

CREATE UNIQUE INDEX tangentx_users_address_key ON public.tangentx_users USING btree (address);

CREATE UNIQUE INDEX tangentx_users_pkey ON public.tangentx_users USING btree (id);

CREATE UNIQUE INDEX tangentx_users_referral_code_key ON public.tangentx_users USING btree (referral_code);

CREATE UNIQUE INDEX task_dependencies_pkey ON public.task_dependencies USING btree (id);

CREATE UNIQUE INDEX task_dependencies_task_id_depends_on_task_id_key ON public.task_dependencies USING btree (task_id, depends_on_task_id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX testnet_transactions_pkey ON public.testnet_transactions USING btree (id);

CREATE UNIQUE INDEX testnet_transactions_transaction_hash_key ON public.testnet_transactions USING btree (transaction_hash);

CREATE UNIQUE INDEX testnet_wallets_address_key ON public.testnet_wallets USING btree (address);

CREATE UNIQUE INDEX testnet_wallets_pkey ON public.testnet_wallets USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX transactions_transaction_hash_key ON public.transactions USING btree (transaction_hash);

CREATE UNIQUE INDEX unique_follow_chain ON public.mocat_ai_follows USING btree (follower_id, expert_trader_id, chain_id);

CREATE UNIQUE INDEX urejesho_ai_proposals_pkey ON public.urejesho_ai_proposals USING btree (id);

CREATE UNIQUE INDEX urejesho_ai_verifications_pkey ON public.urejesho_ai_verifications USING btree (id);

CREATE UNIQUE INDEX urejesho_donations_hedera_transaction_id_key ON public.urejesho_donations USING btree (hedera_transaction_id);

CREATE UNIQUE INDEX urejesho_donations_pkey ON public.urejesho_donations USING btree (id);

CREATE UNIQUE INDEX urejesho_file_registry_pkey ON public.urejesho_file_registry USING btree (id);

CREATE UNIQUE INDEX urejesho_global_pool_config_chain_key ON public.urejesho_global_pool_config USING btree (chain);

CREATE UNIQUE INDEX urejesho_global_pool_config_pkey ON public.urejesho_global_pool_config USING btree (id);

CREATE UNIQUE INDEX urejesho_impact_badges_nft_token_id_key ON public.urejesho_impact_badges USING btree (nft_token_id);

CREATE UNIQUE INDEX urejesho_impact_badges_pkey ON public.urejesho_impact_badges USING btree (id);

CREATE UNIQUE INDEX urejesho_milestones_chain_hedera_milestone_id_key ON public.urejesho_milestones USING btree (chain, hedera_milestone_id);

CREATE UNIQUE INDEX urejesho_milestones_pkey ON public.urejesho_milestones USING btree (id);

CREATE UNIQUE INDEX urejesho_milestones_project_id_milestone_number_key ON public.urejesho_milestones USING btree (project_id, milestone_number);

CREATE UNIQUE INDEX urejesho_ngo_credentials_chain_ngo_id_key ON public.urejesho_ngo_credentials USING btree (chain, ngo_id);

CREATE UNIQUE INDEX urejesho_ngo_credentials_credential_id_key ON public.urejesho_ngo_credentials USING btree (credential_id);

CREATE UNIQUE INDEX urejesho_ngo_credentials_pkey ON public.urejesho_ngo_credentials USING btree (id);

CREATE UNIQUE INDEX urejesho_ngos_chain_hedera_account_id_key ON public.urejesho_ngos USING btree (chain, hedera_account_id);

CREATE UNIQUE INDEX urejesho_ngos_pkey ON public.urejesho_ngos USING btree (id);

CREATE UNIQUE INDEX urejesho_project_updates_pkey ON public.urejesho_project_updates USING btree (id);

CREATE UNIQUE INDEX urejesho_projects_pkey ON public.urejesho_projects USING btree (id);

CREATE UNIQUE INDEX urejesho_satellite_imagery_pkey ON public.urejesho_satellite_imagery USING btree (id);

CREATE UNIQUE INDEX urejesho_saved_projects_chain_user_hedera_account_id_projec_key ON public.urejesho_saved_projects USING btree (chain, user_hedera_account_id, project_id);

CREATE UNIQUE INDEX urejesho_saved_projects_pkey ON public.urejesho_saved_projects USING btree (id);

CREATE UNIQUE INDEX urejesho_users_chain_hedera_account_id_key ON public.urejesho_users USING btree (chain, hedera_account_id);

CREATE UNIQUE INDEX urejesho_users_pkey ON public.urejesho_users USING btree (id);

CREATE UNIQUE INDEX urejesho_vault_fee_accounts_pkey ON public.urejesho_vault_fee_accounts USING btree (hedera_account_id);

CREATE UNIQUE INDEX urejesho_vault_fee_monitoring_state_pkey ON public.urejesho_vault_fee_monitoring_state USING btree (hedera_account_id);

CREATE UNIQUE INDEX urejesho_vault_fee_monthly_sc_hedera_account_id_scheduled_d_key ON public.urejesho_vault_fee_monthly_schedule USING btree (hedera_account_id, scheduled_date);

CREATE UNIQUE INDEX urejesho_vault_fee_monthly_schedule_hedera_transaction_id_key ON public.urejesho_vault_fee_monthly_schedule USING btree (hedera_transaction_id);

CREATE UNIQUE INDEX urejesho_vault_fee_monthly_schedule_pkey ON public.urejesho_vault_fee_monthly_schedule USING btree (id);

CREATE UNIQUE INDEX urejesho_vault_fee_transactions_hedera_transaction_id_key ON public.urejesho_vault_fee_transactions USING btree (hedera_transaction_id);

CREATE UNIQUE INDEX urejesho_vault_fee_transactions_pkey ON public.urejesho_vault_fee_transactions USING btree (id);

CREATE UNIQUE INDEX urejesho_votes_hcs_message_id_key ON public.urejesho_votes USING btree (hcs_message_id);

CREATE UNIQUE INDEX urejesho_votes_pkey ON public.urejesho_votes USING btree (id);

CREATE UNIQUE INDEX urejesho_votes_proposal_id_voter_account_id_key ON public.urejesho_votes USING btree (proposal_id, voter_account_id);

CREATE UNIQUE INDEX urejesho_voting_proposals_pkey ON public.urejesho_voting_proposals USING btree (id);

CREATE UNIQUE INDEX vault_fee_accounts_hedera_account_id_key ON public.vault_fee_accounts USING btree (hedera_account_id);

CREATE UNIQUE INDEX vault_fee_accounts_pkey ON public.vault_fee_accounts USING btree (id);

CREATE UNIQUE INDEX vault_fee_transactions_hedera_transaction_id_key ON public.vault_fee_transactions USING btree (hedera_transaction_id);

CREATE UNIQUE INDEX vault_fee_transactions_pkey ON public.vault_fee_transactions USING btree (id);

CREATE UNIQUE INDEX velox_bid_transactions_bid_tx_hash_key ON public.velox_bid_transactions USING btree (bid_tx_hash);

CREATE UNIQUE INDEX velox_bid_transactions_pkey ON public.velox_bid_transactions USING btree (id);

CREATE UNIQUE INDEX velox_maker_transactions_intent_id_key ON public.velox_maker_transactions USING btree (intent_id);

CREATE UNIQUE INDEX velox_maker_transactions_pkey ON public.velox_maker_transactions USING btree (id);

CREATE UNIQUE INDEX velox_taker_transactions_pkey ON public.velox_taker_transactions USING btree (id);

CREATE UNIQUE INDEX velox_taker_transactions_taker_tx_hash_key ON public.velox_taker_transactions USING btree (taker_tx_hash);

CREATE UNIQUE INDEX wallets_address_key ON public.wallets USING btree (address);

CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id);

CREATE UNIQUE INDEX workflows_pkey ON public.workflows USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_comment_likes_comment_id_user_address_key ON public.yellowdotfun_comment_likes USING btree (comment_id, user_address);

CREATE UNIQUE INDEX yellowdotfun_comment_likes_pkey ON public.yellowdotfun_comment_likes USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_comments_pkey ON public.yellowdotfun_comments USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_creator_earnings_creator_address_token_id_key ON public.yellowdotfun_creator_earnings USING btree (creator_address, token_id);

CREATE UNIQUE INDEX yellowdotfun_creator_earnings_pkey ON public.yellowdotfun_creator_earnings USING btree (id);

CREATE INDEX yellowdotfun_idx_balances_nonzero ON public.yellowdotfun_user_balances USING btree (token_id, balance) WHERE (balance > (0)::numeric);

CREATE INDEX yellowdotfun_idx_balances_token ON public.yellowdotfun_user_balances USING btree (token_id);

CREATE INDEX yellowdotfun_idx_balances_user ON public.yellowdotfun_user_balances USING btree (user_address);

CREATE INDEX yellowdotfun_idx_comment_likes_comment_id ON public.yellowdotfun_comment_likes USING btree (comment_id);

CREATE INDEX yellowdotfun_idx_comment_likes_user_address ON public.yellowdotfun_comment_likes USING btree (user_address);

CREATE INDEX yellowdotfun_idx_comments_parent ON public.yellowdotfun_comments USING btree (parent_comment_id) WHERE (parent_comment_id IS NOT NULL);

CREATE INDEX yellowdotfun_idx_comments_token ON public.yellowdotfun_comments USING btree (token_id, created_at DESC);

CREATE INDEX yellowdotfun_idx_earnings_creator ON public.yellowdotfun_creator_earnings USING btree (creator_address);

CREATE INDEX yellowdotfun_idx_earnings_unclaimed ON public.yellowdotfun_creator_earnings USING btree (creator_address, total_fees_earned, total_fees_claimed);

CREATE INDEX yellowdotfun_idx_tokens_created_at ON public.yellowdotfun_tokens USING btree (created_at DESC);

CREATE INDEX yellowdotfun_idx_tokens_creator ON public.yellowdotfun_tokens USING btree (creator_address);

CREATE INDEX yellowdotfun_idx_tokens_graduated ON public.yellowdotfun_tokens USING btree (is_graduated, graduated_at DESC);

CREATE INDEX yellowdotfun_idx_tokens_holder_count ON public.yellowdotfun_tokens USING btree (holder_count DESC);

CREATE INDEX yellowdotfun_idx_tokens_last_trade ON public.yellowdotfun_tokens USING btree (last_trade_at DESC NULLS LAST);

CREATE INDEX yellowdotfun_idx_tokens_volume_24h ON public.yellowdotfun_tokens USING btree (volume_24h DESC);

CREATE INDEX yellowdotfun_idx_top_holders ON public.yellowdotfun_top_holders USING btree (token_id, rank);

CREATE INDEX yellowdotfun_idx_trades_time ON public.yellowdotfun_trades USING btree ("timestamp" DESC);

CREATE INDEX yellowdotfun_idx_trades_token_time ON public.yellowdotfun_trades USING btree (token_id, "timestamp" DESC);

CREATE INDEX yellowdotfun_idx_trades_trader ON public.yellowdotfun_trades USING btree (trader_address, "timestamp" DESC);

CREATE INDEX yellowdotfun_idx_trades_type ON public.yellowdotfun_trades USING btree (token_id, trade_type, "timestamp" DESC);

CREATE INDEX yellowdotfun_idx_watchlist_user ON public.yellowdotfun_watchlist USING btree (user_address);

CREATE UNIQUE INDEX yellowdotfun_tokens_pkey ON public.yellowdotfun_tokens USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_tokens_ticker_key ON public.yellowdotfun_tokens USING btree (ticker);

CREATE UNIQUE INDEX yellowdotfun_top_holders_pkey ON public.yellowdotfun_top_holders USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_top_holders_token_id_user_address_key ON public.yellowdotfun_top_holders USING btree (token_id, user_address);

CREATE UNIQUE INDEX yellowdotfun_trades_pkey ON public.yellowdotfun_trades USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_user_balances_pkey ON public.yellowdotfun_user_balances USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_user_balances_user_address_token_id_key ON public.yellowdotfun_user_balances USING btree (user_address, token_id);

CREATE UNIQUE INDEX yellowdotfun_watchlist_pkey ON public.yellowdotfun_watchlist USING btree (id);

CREATE UNIQUE INDEX yellowdotfun_watchlist_user_address_token_id_key ON public.yellowdotfun_watchlist USING btree (user_address, token_id);

CREATE UNIQUE INDEX yellowperps_level_history_pkey ON public.yellowperps_level_history USING btree (id);

CREATE UNIQUE INDEX yellowperps_positions_pkey ON public.yellowperps_positions USING btree (id);

CREATE UNIQUE INDEX yellowperps_price_feeds_pkey ON public.yellowperps_price_feeds USING btree (symbol);

CREATE UNIQUE INDEX yellowperps_trades_pkey ON public.yellowperps_trades USING btree (id);

CREATE UNIQUE INDEX yellowperps_transactions_pkey ON public.yellowperps_transactions USING btree (id);

CREATE UNIQUE INDEX yellowperps_users_pkey ON public.yellowperps_users USING btree (id);

CREATE UNIQUE INDEX yellowperps_users_wallet_address_key ON public.yellowperps_users USING btree (wallet_address);

alter table "public"."agent_actions" add constraint "agent_actions_pkey" PRIMARY KEY using index "agent_actions_pkey";

alter table "public"."agent_chats" add constraint "agent_chats_pkey" PRIMARY KEY using index "agent_chats_pkey";

alter table "public"."agent_conversations" add constraint "agent_conversations_pkey" PRIMARY KEY using index "agent_conversations_pkey";

alter table "public"."agent_pay_api_keys" add constraint "agent_pay_api_keys_pkey" PRIMARY KEY using index "agent_pay_api_keys_pkey";

alter table "public"."agent_pay_services" add constraint "agent_pay_services_pkey" PRIMARY KEY using index "agent_pay_services_pkey";

alter table "public"."agent_pay_usage" add constraint "agent_pay_usage_pkey" PRIMARY KEY using index "agent_pay_usage_pkey";

alter table "public"."agents" add constraint "agents_pkey" PRIMARY KEY using index "agents_pkey";

alter table "public"."animoca_credential_schemas" add constraint "animoca_credential_schemas_new_pkey" PRIMARY KEY using index "animoca_credential_schemas_new_pkey";

alter table "public"."animoca_credentials" add constraint "animoca_credentials_new_pkey" PRIMARY KEY using index "animoca_credentials_new_pkey";

alter table "public"."animoca_influencers" add constraint "animoca_influencers_new_pkey" PRIMARY KEY using index "animoca_influencers_new_pkey";

alter table "public"."animoca_trades" add constraint "animoca_trades_pkey" PRIMARY KEY using index "animoca_trades_pkey";

alter table "public"."businesses" add constraint "businesses_pkey" PRIMARY KEY using index "businesses_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."comm_styles" add constraint "comm_styles_pkey" PRIMARY KEY using index "comm_styles_pkey";

alter table "public"."commands" add constraint "commands_pkey" PRIMARY KEY using index "commands_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."dxyperps_funding_history" add constraint "dxykaia_funding_history_pkey" PRIMARY KEY using index "dxykaia_funding_history_pkey";

alter table "public"."dxyperps_liquidations" add constraint "dxykaia_liquidations_pkey" PRIMARY KEY using index "dxykaia_liquidations_pkey";

alter table "public"."dxyperps_markets" add constraint "dxykaia_markets_pkey" PRIMARY KEY using index "dxykaia_markets_pkey";

alter table "public"."dxyperps_orders" add constraint "dxykaia_orders_pkey" PRIMARY KEY using index "dxykaia_orders_pkey";

alter table "public"."dxyperps_position_history" add constraint "dxykaia_position_history_pkey" PRIMARY KEY using index "dxykaia_position_history_pkey";

alter table "public"."dxyperps_positions" add constraint "dxykaia_positions_pkey" PRIMARY KEY using index "dxykaia_positions_pkey";

alter table "public"."dxyperps_price_snapshots" add constraint "dxykaia_price_snapshots_pkey" PRIMARY KEY using index "dxykaia_price_snapshots_pkey";

alter table "public"."dxyperps_traders" add constraint "dxykaia_traders_pkey" PRIMARY KEY using index "dxykaia_traders_pkey";

alter table "public"."ember_chat_messages" add constraint "ember_chat_messages_pkey" PRIMARY KEY using index "ember_chat_messages_pkey";

alter table "public"."ember_order_details" add constraint "ember_order_details_pkey" PRIMARY KEY using index "ember_order_details_pkey";

alter table "public"."ember_streams" add constraint "ember_streams_pkey" PRIMARY KEY using index "ember_streams_pkey";

alter table "public"."frameworks" add constraint "frameworks_pkey" PRIMARY KEY using index "frameworks_pkey";

alter table "public"."hackathons" add constraint "hackathons_pkey" PRIMARY KEY using index "hackathons_pkey";

alter table "public"."konstant_nicknames" add constraint "konstant_nicknames_pkey" PRIMARY KEY using index "konstant_nicknames_pkey";

alter table "public"."konstant_profiles" add constraint "konstant_profiles_pkey" PRIMARY KEY using index "konstant_profiles_pkey";

alter table "public"."labang_chat_messages" add constraint "labang_chat_messages_pkey" PRIMARY KEY using index "labang_chat_messages_pkey";

alter table "public"."labang_daily_earnings" add constraint "labang_daily_earnings_pkey" PRIMARY KEY using index "labang_daily_earnings_pkey";

alter table "public"."labang_orders" add constraint "labang_orders_pkey" PRIMARY KEY using index "labang_orders_pkey";

alter table "public"."labang_products" add constraint "labang_products_pkey" PRIMARY KEY using index "labang_products_pkey";

alter table "public"."labang_reviews" add constraint "labang_reviews_pkey" PRIMARY KEY using index "labang_reviews_pkey";

alter table "public"."labang_rewards" add constraint "labang_rewards_pkey" PRIMARY KEY using index "labang_rewards_pkey";

alter table "public"."labang_sellers" add constraint "labang_sellers_pkey" PRIMARY KEY using index "labang_sellers_pkey";

alter table "public"."labang_stream_products" add constraint "labang_stream_products_pkey" PRIMARY KEY using index "labang_stream_products_pkey";

alter table "public"."labang_streams" add constraint "labang_streams_pkey" PRIMARY KEY using index "labang_streams_pkey";

alter table "public"."labang_watch_sessions" add constraint "labang_watch_sessions_pkey" PRIMARY KEY using index "labang_watch_sessions_pkey";

alter table "public"."liquidity_history" add constraint "liquidity_history_pkey" PRIMARY KEY using index "liquidity_history_pkey";

alter table "public"."meetings" add constraint "meetings_pkey" PRIMARY KEY using index "meetings_pkey";

alter table "public"."memories" add constraint "memories_pkey" PRIMARY KEY using index "memories_pkey";

alter table "public"."milestones" add constraint "milestones_pkey" PRIMARY KEY using index "milestones_pkey";

alter table "public"."mocat_ai_ai_agents" add constraint "mocat_ai_ai_agents_pkey" PRIMARY KEY using index "mocat_ai_ai_agents_pkey";

alter table "public"."mocat_ai_clusters" add constraint "mocat_ai_clusters_pkey" PRIMARY KEY using index "mocat_ai_clusters_pkey";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_pkey" PRIMARY KEY using index "mocat_ai_consensus_records_pkey";

alter table "public"."mocat_ai_copy_trading" add constraint "mocat_ai_copy_trading_pkey" PRIMARY KEY using index "mocat_ai_copy_trading_pkey";

alter table "public"."mocat_ai_expert_traders" add constraint "mocat_ai_expert_traders_pkey" PRIMARY KEY using index "mocat_ai_expert_traders_pkey";

alter table "public"."mocat_ai_follows" add constraint "mocat_ai_follows_pkey" PRIMARY KEY using index "mocat_ai_follows_pkey";

alter table "public"."mocat_ai_moca_credentials" add constraint "mocat_ai_moca_credentials_pkey" PRIMARY KEY using index "mocat_ai_moca_credentials_pkey";

alter table "public"."mocat_ai_signal_validations" add constraint "mocat_ai_signal_validations_pkey" PRIMARY KEY using index "mocat_ai_signal_validations_pkey";

alter table "public"."mocat_ai_trading_signals" add constraint "mocat_ai_trading_signals_pkey" PRIMARY KEY using index "mocat_ai_trading_signals_pkey";

alter table "public"."mocat_ai_users" add constraint "mocat_ai_users_pkey" PRIMARY KEY using index "mocat_ai_users_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_pkey" PRIMARY KEY using index "playwright_allocations_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."project_b2b_clients" add constraint "project_b2b_clients_pkey" PRIMARY KEY using index "project_b2b_clients_pkey";

alter table "public"."project_network_activity" add constraint "project_network_activity_pkey" PRIMARY KEY using index "project_network_activity_pkey";

alter table "public"."project_onchain_metrics" add constraint "project_onchain_metrics_pkey" PRIMARY KEY using index "project_onchain_metrics_pkey";

alter table "public"."project_onchain_transactions" add constraint "project_onchain_transactions_pkey" PRIMARY KEY using index "project_onchain_transactions_pkey";

alter table "public"."project_social_activities" add constraint "project_social_activities_pkey" PRIMARY KEY using index "project_social_activities_pkey";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_pkey" PRIMARY KEY using index "project_social_metrics_pkey";

alter table "public"."project_wallets" add constraint "project_wallets_pkey" PRIMARY KEY using index "project_wallets_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."salvation_businesses" add constraint "salvation_businesses_pkey" PRIMARY KEY using index "salvation_businesses_pkey";

alter table "public"."salvation_conversations" add constraint "salvation_conversations_pkey" PRIMARY KEY using index "salvation_conversations_pkey";

alter table "public"."salvation_ipfs_metadata" add constraint "salvation_ipfs_metadata_pkey" PRIMARY KEY using index "salvation_ipfs_metadata_pkey";

alter table "public"."salvation_project_applications" add constraint "salvation_project_applications_pkey" PRIMARY KEY using index "salvation_project_applications_pkey";

alter table "public"."sentinel_api_keys" add constraint "sentinel_api_keys_pkey" PRIMARY KEY using index "sentinel_api_keys_pkey";

alter table "public"."sentinel_debugger_runs" add constraint "sentinel_debugger_runs_pkey" PRIMARY KEY using index "sentinel_debugger_runs_pkey";

alter table "public"."sentinel_gas_analyses" add constraint "sentinel_gas_analyses_pkey" PRIMARY KEY using index "sentinel_gas_analyses_pkey";

alter table "public"."sentinel_projects" add constraint "sentinel_projects_pkey" PRIMARY KEY using index "sentinel_projects_pkey";

alter table "public"."sentinel_prover_runs" add constraint "sentinel_prover_runs_pkey" PRIMARY KEY using index "sentinel_prover_runs_pkey";

alter table "public"."sentinel_simulations" add constraint "sentinel_simulations_pkey" PRIMARY KEY using index "sentinel_simulations_pkey";

alter table "public"."sentinel_team_invites" add constraint "sentinel_team_invites_pkey" PRIMARY KEY using index "sentinel_team_invites_pkey";

alter table "public"."sentinel_team_members" add constraint "sentinel_team_members_pkey" PRIMARY KEY using index "sentinel_team_members_pkey";

alter table "public"."sentinel_teams" add constraint "sentinel_teams_pkey" PRIMARY KEY using index "sentinel_teams_pkey";

alter table "public"."sentinel_users" add constraint "sentinel_users_pkey" PRIMARY KEY using index "sentinel_users_pkey";

alter table "public"."service_key_audit_log" add constraint "service_key_audit_log_pkey" PRIMARY KEY using index "service_key_audit_log_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."shinroe_users" add constraint "shinroe_users_pkey" PRIMARY KEY using index "shinroe_users_pkey";

alter table "public"."tangentx_market_stats" add constraint "tangentx_market_stats_pkey" PRIMARY KEY using index "tangentx_market_stats_pkey";

alter table "public"."tangentx_markets" add constraint "tangentx_markets_pkey" PRIMARY KEY using index "tangentx_markets_pkey";

alter table "public"."tangentx_positions" add constraint "tangentx_positions_pkey" PRIMARY KEY using index "tangentx_positions_pkey";

alter table "public"."tangentx_trades" add constraint "tangentx_trades_pkey" PRIMARY KEY using index "tangentx_trades_pkey";

alter table "public"."tangentx_users" add constraint "tangentx_users_pkey" PRIMARY KEY using index "tangentx_users_pkey";

alter table "public"."task_dependencies" add constraint "task_dependencies_pkey" PRIMARY KEY using index "task_dependencies_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."testnet_transactions" add constraint "testnet_transactions_pkey" PRIMARY KEY using index "testnet_transactions_pkey";

alter table "public"."testnet_wallets" add constraint "testnet_wallets_pkey" PRIMARY KEY using index "testnet_wallets_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."urejesho_ai_proposals" add constraint "urejesho_ai_proposals_pkey" PRIMARY KEY using index "urejesho_ai_proposals_pkey";

alter table "public"."urejesho_ai_verifications" add constraint "urejesho_ai_verifications_pkey" PRIMARY KEY using index "urejesho_ai_verifications_pkey";

alter table "public"."urejesho_donations" add constraint "urejesho_donations_pkey" PRIMARY KEY using index "urejesho_donations_pkey";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_pkey" PRIMARY KEY using index "urejesho_file_registry_pkey";

alter table "public"."urejesho_global_pool_config" add constraint "urejesho_global_pool_config_pkey" PRIMARY KEY using index "urejesho_global_pool_config_pkey";

alter table "public"."urejesho_impact_badges" add constraint "urejesho_impact_badges_pkey" PRIMARY KEY using index "urejesho_impact_badges_pkey";

alter table "public"."urejesho_milestones" add constraint "urejesho_milestones_pkey" PRIMARY KEY using index "urejesho_milestones_pkey";

alter table "public"."urejesho_ngo_credentials" add constraint "urejesho_ngo_credentials_pkey" PRIMARY KEY using index "urejesho_ngo_credentials_pkey";

alter table "public"."urejesho_ngos" add constraint "urejesho_ngos_pkey" PRIMARY KEY using index "urejesho_ngos_pkey";

alter table "public"."urejesho_project_updates" add constraint "urejesho_project_updates_pkey" PRIMARY KEY using index "urejesho_project_updates_pkey";

alter table "public"."urejesho_projects" add constraint "urejesho_projects_pkey" PRIMARY KEY using index "urejesho_projects_pkey";

alter table "public"."urejesho_satellite_imagery" add constraint "urejesho_satellite_imagery_pkey" PRIMARY KEY using index "urejesho_satellite_imagery_pkey";

alter table "public"."urejesho_saved_projects" add constraint "urejesho_saved_projects_pkey" PRIMARY KEY using index "urejesho_saved_projects_pkey";

alter table "public"."urejesho_users" add constraint "urejesho_users_pkey" PRIMARY KEY using index "urejesho_users_pkey";

alter table "public"."urejesho_vault_fee_accounts" add constraint "urejesho_vault_fee_accounts_pkey" PRIMARY KEY using index "urejesho_vault_fee_accounts_pkey";

alter table "public"."urejesho_vault_fee_monitoring_state" add constraint "urejesho_vault_fee_monitoring_state_pkey" PRIMARY KEY using index "urejesho_vault_fee_monitoring_state_pkey";

alter table "public"."urejesho_vault_fee_monthly_schedule" add constraint "urejesho_vault_fee_monthly_schedule_pkey" PRIMARY KEY using index "urejesho_vault_fee_monthly_schedule_pkey";

alter table "public"."urejesho_vault_fee_transactions" add constraint "urejesho_vault_fee_transactions_pkey" PRIMARY KEY using index "urejesho_vault_fee_transactions_pkey";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_pkey" PRIMARY KEY using index "urejesho_votes_pkey";

alter table "public"."urejesho_voting_proposals" add constraint "urejesho_voting_proposals_pkey" PRIMARY KEY using index "urejesho_voting_proposals_pkey";

alter table "public"."vault_fee_accounts" add constraint "vault_fee_accounts_pkey" PRIMARY KEY using index "vault_fee_accounts_pkey";

alter table "public"."vault_fee_transactions" add constraint "vault_fee_transactions_pkey" PRIMARY KEY using index "vault_fee_transactions_pkey";

alter table "public"."velox_bid_transactions" add constraint "velox_bid_transactions_pkey" PRIMARY KEY using index "velox_bid_transactions_pkey";

alter table "public"."velox_maker_transactions" add constraint "velox_maker_transactions_pkey" PRIMARY KEY using index "velox_maker_transactions_pkey";

alter table "public"."velox_taker_transactions" add constraint "velox_taker_transactions_pkey" PRIMARY KEY using index "velox_taker_transactions_pkey";

alter table "public"."wallets" add constraint "wallets_pkey" PRIMARY KEY using index "wallets_pkey";

alter table "public"."workflows" add constraint "workflows_pkey" PRIMARY KEY using index "workflows_pkey";

alter table "public"."yellowdotfun_comment_likes" add constraint "yellowdotfun_comment_likes_pkey" PRIMARY KEY using index "yellowdotfun_comment_likes_pkey";

alter table "public"."yellowdotfun_comments" add constraint "yellowdotfun_comments_pkey" PRIMARY KEY using index "yellowdotfun_comments_pkey";

alter table "public"."yellowdotfun_creator_earnings" add constraint "yellowdotfun_creator_earnings_pkey" PRIMARY KEY using index "yellowdotfun_creator_earnings_pkey";

alter table "public"."yellowdotfun_tokens" add constraint "yellowdotfun_tokens_pkey" PRIMARY KEY using index "yellowdotfun_tokens_pkey";

alter table "public"."yellowdotfun_top_holders" add constraint "yellowdotfun_top_holders_pkey" PRIMARY KEY using index "yellowdotfun_top_holders_pkey";

alter table "public"."yellowdotfun_trades" add constraint "yellowdotfun_trades_pkey" PRIMARY KEY using index "yellowdotfun_trades_pkey";

alter table "public"."yellowdotfun_user_balances" add constraint "yellowdotfun_user_balances_pkey" PRIMARY KEY using index "yellowdotfun_user_balances_pkey";

alter table "public"."yellowdotfun_watchlist" add constraint "yellowdotfun_watchlist_pkey" PRIMARY KEY using index "yellowdotfun_watchlist_pkey";

alter table "public"."yellowperps_level_history" add constraint "yellowperps_level_history_pkey" PRIMARY KEY using index "yellowperps_level_history_pkey";

alter table "public"."yellowperps_positions" add constraint "yellowperps_positions_pkey" PRIMARY KEY using index "yellowperps_positions_pkey";

alter table "public"."yellowperps_price_feeds" add constraint "yellowperps_price_feeds_pkey" PRIMARY KEY using index "yellowperps_price_feeds_pkey";

alter table "public"."yellowperps_trades" add constraint "yellowperps_trades_pkey" PRIMARY KEY using index "yellowperps_trades_pkey";

alter table "public"."yellowperps_transactions" add constraint "yellowperps_transactions_pkey" PRIMARY KEY using index "yellowperps_transactions_pkey";

alter table "public"."yellowperps_users" add constraint "yellowperps_users_pkey" PRIMARY KEY using index "yellowperps_users_pkey";

alter table "public"."agent_actions" add constraint "agent_actions_action_type_check" CHECK ((action_type = ANY (ARRAY['conversation'::text, 'negotiation'::text, 'research'::text, 'social_media_post'::text, 'content_creation'::text, 'email_response'::text, 'task_execution'::text, 'web_scraping'::text, 'data_analysis'::text, 'code_generation'::text, 'document_review'::text, 'meeting'::text, 'crypto_news_browse'::text, 'twitter_post'::text]))) not valid;

alter table "public"."agent_actions" validate constraint "agent_actions_action_type_check";

alter table "public"."agent_actions" add constraint "agent_actions_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE not valid;

alter table "public"."agent_actions" validate constraint "agent_actions_agent_id_fkey";

alter table "public"."agent_actions" add constraint "agent_actions_frequency_check" CHECK ((frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text, 'custom'::text]))) not valid;

alter table "public"."agent_actions" validate constraint "agent_actions_frequency_check";

alter table "public"."agent_actions" add constraint "agent_actions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."agent_actions" validate constraint "agent_actions_status_check";

alter table "public"."agent_actions" add constraint "agent_actions_target_type_check" CHECK ((target_type = ANY (ARRAY['profile'::text, 'business'::text, 'project'::text, 'personal'::text]))) not valid;

alter table "public"."agent_actions" validate constraint "agent_actions_target_type_check";

alter table "public"."agent_chats" add constraint "agent_chats_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.agent_conversations(id) ON DELETE CASCADE not valid;

alter table "public"."agent_chats" validate constraint "agent_chats_conversation_id_fkey";

alter table "public"."agent_chats" add constraint "agent_chats_sender_type_check" CHECK ((sender_type = ANY (ARRAY['agent'::text, 'profile'::text]))) not valid;

alter table "public"."agent_chats" validate constraint "agent_chats_sender_type_check";

alter table "public"."agent_conversations" add constraint "agent_conversations_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE not valid;

alter table "public"."agent_conversations" validate constraint "agent_conversations_agent_id_fkey";

alter table "public"."agent_conversations" add constraint "agent_conversations_channel_check" CHECK ((channel = ANY (ARRAY['email'::text, 'telegram'::text, 'whatsapp'::text, 'linkedin'::text, 'twitter'::text, 'direct'::text]))) not valid;

alter table "public"."agent_conversations" validate constraint "agent_conversations_channel_check";

alter table "public"."agent_conversations" add constraint "agent_conversations_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."agent_conversations" validate constraint "agent_conversations_profile_id_fkey";

alter table "public"."agent_conversations" add constraint "agent_conversations_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text]))) not valid;

alter table "public"."agent_conversations" validate constraint "agent_conversations_status_check";

alter table "public"."agent_pay_usage" add constraint "agent_pay_usage_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.agent_pay_services(id) ON DELETE CASCADE not valid;

alter table "public"."agent_pay_usage" validate constraint "agent_pay_usage_service_id_fkey";

alter table "public"."agents" add constraint "agents_mood_check" CHECK ((mood = ANY (ARRAY['idle'::text, 'sad'::text, 'smile'::text, 'angry'::text, 'working'::text, 'party'::text]))) not valid;

alter table "public"."agents" validate constraint "agents_mood_check";

alter table "public"."agents" add constraint "agents_name_key" UNIQUE using index "agents_name_key";

alter table "public"."agents" add constraint "agents_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'idle'::text, 'busy'::text]))) not valid;

alter table "public"."agents" validate constraint "agents_status_check";

alter table "public"."animoca_credentials" add constraint "animoca_credentials_new_category_check" CHECK ((category = ANY (ARRAY['Education'::text, 'Professional'::text, 'Skill'::text, 'Custom'::text]))) not valid;

alter table "public"."animoca_credentials" validate constraint "animoca_credentials_new_category_check";

alter table "public"."animoca_credentials" add constraint "animoca_credentials_new_token_address_key" UNIQUE using index "animoca_credentials_new_token_address_key";

alter table "public"."animoca_credentials" add constraint "animoca_fk_credentials_schema" FOREIGN KEY (credential_schema_id) REFERENCES public.animoca_credential_schemas(id) ON DELETE SET NULL not valid;

alter table "public"."animoca_credentials" validate constraint "animoca_fk_credentials_schema";

alter table "public"."animoca_influencers" add constraint "animoca_influencers_new_token_address_key" UNIQUE using index "animoca_influencers_new_token_address_key";

alter table "public"."businesses" add constraint "businesses_slug_key" UNIQUE using index "businesses_slug_key";

alter table "public"."businesses" add constraint "businesses_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text, 'suspended'::text]))) not valid;

alter table "public"."businesses" validate constraint "businesses_status_check";

alter table "public"."chats" add constraint "chats_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_conversation_id_fkey";

alter table "public"."chats" add constraint "chats_importance_level_check" CHECK (((importance_level >= 1) AND (importance_level <= 10))) not valid;

alter table "public"."chats" validate constraint "chats_importance_level_check";

alter table "public"."chats" add constraint "chats_message_type_check" CHECK ((message_type = ANY (ARRAY['text'::text, 'command'::text, 'code'::text, 'file'::text, 'image'::text, 'error'::text, 'success'::text, 'warning'::text, 'thinking'::text, 'tool_use'::text, 'result'::text]))) not valid;

alter table "public"."chats" validate constraint "chats_message_type_check";

alter table "public"."chats" add constraint "chats_sender_check" CHECK ((sender = ANY (ARRAY['owner'::text, 'agent'::text]))) not valid;

alter table "public"."chats" validate constraint "chats_sender_check";

alter table "public"."commands" add constraint "commands_category_check" CHECK ((category = ANY (ARRAY['build'::text, 'debug'::text, 'deploy'::text, 'test'::text, 'analyze'::text, 'wallet'::text, 'optimize'::text]))) not valid;

alter table "public"."commands" validate constraint "commands_category_check";

alter table "public"."commands" add constraint "commands_executed_by_agent_id_fkey" FOREIGN KEY (executed_by_agent_id) REFERENCES public.agents(id) not valid;

alter table "public"."commands" validate constraint "commands_executed_by_agent_id_fkey";

alter table "public"."commands" add constraint "commands_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL not valid;

alter table "public"."commands" validate constraint "commands_session_id_fkey";

alter table "public"."commands" add constraint "commands_status_check" CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'error'::text]))) not valid;

alter table "public"."commands" validate constraint "commands_status_check";

alter table "public"."conversations" add constraint "conversations_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_agent_id_fkey";

alter table "public"."conversations" add constraint "conversations_agent_mood_check" CHECK ((agent_mood = ANY (ARRAY['idle'::text, 'sad'::text, 'smile'::text, 'angry'::text, 'working'::text, 'party'::text]))) not valid;

alter table "public"."conversations" validate constraint "conversations_agent_mood_check";

alter table "public"."conversations" add constraint "conversations_agent_performance_rating_check" CHECK (((agent_performance_rating >= 1) AND (agent_performance_rating <= 10))) not valid;

alter table "public"."conversations" validate constraint "conversations_agent_performance_rating_check";

alter table "public"."conversations" add constraint "conversations_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL not valid;

alter table "public"."conversations" validate constraint "conversations_business_id_fkey";

alter table "public"."conversations" add constraint "conversations_priority_check" CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))) not valid;

alter table "public"."conversations" validate constraint "conversations_priority_check";

alter table "public"."conversations" add constraint "conversations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."conversations" validate constraint "conversations_project_id_fkey";

alter table "public"."conversations" add constraint "conversations_purpose_check" CHECK ((purpose = ANY (ARRAY['task_assignment'::text, 'project_discussion'::text, 'status_update'::text, 'strategy_planning'::text, 'troubleshooting'::text, 'general_chat'::text, 'review'::text, 'training'::text, 'configuration'::text]))) not valid;

alter table "public"."conversations" validate constraint "conversations_purpose_check";

alter table "public"."conversations" add constraint "conversations_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL not valid;

alter table "public"."conversations" validate constraint "conversations_session_id_fkey";

alter table "public"."conversations" add constraint "conversations_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'archived'::text]))) not valid;

alter table "public"."conversations" validate constraint "conversations_status_check";

alter table "public"."dxyperps_funding_history" add constraint "dxyperps_funding_history_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.dxyperps_markets(id) not valid;

alter table "public"."dxyperps_funding_history" validate constraint "dxyperps_funding_history_market_id_fkey";

alter table "public"."dxyperps_liquidations" add constraint "dxyperps_liquidations_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.dxyperps_markets(id) not valid;

alter table "public"."dxyperps_liquidations" validate constraint "dxyperps_liquidations_market_id_fkey";

alter table "public"."dxyperps_liquidations" add constraint "dxyperps_liquidations_trader_id_fkey" FOREIGN KEY (trader_id) REFERENCES public.dxyperps_traders(id) not valid;

alter table "public"."dxyperps_liquidations" validate constraint "dxyperps_liquidations_trader_id_fkey";

alter table "public"."dxyperps_markets" add constraint "dxyperps_markets_symbol_chain_id_key" UNIQUE using index "dxyperps_markets_symbol_chain_id_key";

alter table "public"."dxyperps_markets" add constraint "dxyperps_markets_symbol_chain_unique" UNIQUE using index "dxyperps_markets_symbol_chain_unique";

alter table "public"."dxyperps_orders" add constraint "dxykaia_orders_order_type_check" CHECK (((order_type)::text = ANY ((ARRAY['MARKET'::character varying, 'LIMIT'::character varying, 'STOP'::character varying, 'STOP_LIMIT'::character varying, 'TAKE_PROFIT'::character varying, 'STOP_LOSS'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_orders" validate constraint "dxykaia_orders_order_type_check";

alter table "public"."dxyperps_orders" add constraint "dxykaia_orders_side_check" CHECK (((side)::text = ANY ((ARRAY['BUY'::character varying, 'SELL'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_orders" validate constraint "dxykaia_orders_side_check";

alter table "public"."dxyperps_orders" add constraint "dxykaia_orders_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'FILLED'::character varying, 'PARTIALLY_FILLED'::character varying, 'CANCELLED'::character varying, 'REJECTED'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_orders" validate constraint "dxykaia_orders_status_check";

alter table "public"."dxyperps_orders" add constraint "dxyperps_orders_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.dxyperps_markets(id) not valid;

alter table "public"."dxyperps_orders" validate constraint "dxyperps_orders_market_id_fkey";

alter table "public"."dxyperps_orders" add constraint "dxyperps_orders_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public.dxyperps_positions(id) not valid;

alter table "public"."dxyperps_orders" validate constraint "dxyperps_orders_position_id_fkey";

alter table "public"."dxyperps_orders" add constraint "dxyperps_orders_trader_id_fkey" FOREIGN KEY (trader_id) REFERENCES public.dxyperps_traders(id) not valid;

alter table "public"."dxyperps_orders" validate constraint "dxyperps_orders_trader_id_fkey";

alter table "public"."dxyperps_position_history" add constraint "dxykaia_position_history_close_reason_check" CHECK (((close_reason)::text = ANY ((ARRAY['MANUAL'::character varying, 'STOP_LOSS'::character varying, 'TAKE_PROFIT'::character varying, 'LIQUIDATION'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_position_history" validate constraint "dxykaia_position_history_close_reason_check";

alter table "public"."dxyperps_position_history" add constraint "dxyperps_position_history_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.dxyperps_markets(id) not valid;

alter table "public"."dxyperps_position_history" validate constraint "dxyperps_position_history_market_id_fkey";

alter table "public"."dxyperps_position_history" add constraint "dxyperps_position_history_trader_id_fkey" FOREIGN KEY (trader_id) REFERENCES public.dxyperps_traders(id) not valid;

alter table "public"."dxyperps_position_history" validate constraint "dxyperps_position_history_trader_id_fkey";

alter table "public"."dxyperps_positions" add constraint "dxykaia_positions_leverage_check" CHECK (((leverage >= 1) AND (leverage <= 100))) not valid;

alter table "public"."dxyperps_positions" validate constraint "dxykaia_positions_leverage_check";

alter table "public"."dxyperps_positions" add constraint "dxykaia_positions_position_type_check" CHECK (((position_type)::text = ANY ((ARRAY['LONG'::character varying, 'SHORT'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_positions" validate constraint "dxykaia_positions_position_type_check";

alter table "public"."dxyperps_positions" add constraint "dxykaia_positions_status_check" CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'CLOSING'::character varying, 'CLOSED'::character varying, 'LIQUIDATED'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_positions" validate constraint "dxykaia_positions_status_check";

alter table "public"."dxyperps_positions" add constraint "dxyperps_positions_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.dxyperps_markets(id) not valid;

alter table "public"."dxyperps_positions" validate constraint "dxyperps_positions_market_id_fkey";

alter table "public"."dxyperps_positions" add constraint "dxyperps_positions_trader_id_fkey" FOREIGN KEY (trader_id) REFERENCES public.dxyperps_traders(id) not valid;

alter table "public"."dxyperps_positions" validate constraint "dxyperps_positions_trader_id_fkey";

alter table "public"."dxyperps_price_snapshots" add constraint "dxykaia_price_snapshots_timeframe_check" CHECK (((timeframe)::text = ANY ((ARRAY['1m'::character varying, '5m'::character varying, '15m'::character varying, '1h'::character varying, '4h'::character varying, '1d'::character varying])::text[]))) not valid;

alter table "public"."dxyperps_price_snapshots" validate constraint "dxykaia_price_snapshots_timeframe_check";

alter table "public"."dxyperps_price_snapshots" add constraint "dxyperps_price_snapshots_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.dxyperps_markets(id) not valid;

alter table "public"."dxyperps_price_snapshots" validate constraint "dxyperps_price_snapshots_market_id_fkey";

alter table "public"."dxyperps_price_snapshots" add constraint "dxyperps_price_snapshots_unique" UNIQUE using index "dxyperps_price_snapshots_unique";

alter table "public"."dxyperps_traders" add constraint "dxyperps_traders_wallet_address_chain_id_key" UNIQUE using index "dxyperps_traders_wallet_address_chain_id_key";

alter table "public"."dxyperps_traders" add constraint "dxyperps_traders_wallet_chain_unique" UNIQUE using index "dxyperps_traders_wallet_chain_unique";

alter table "public"."ember_chat_messages" add constraint "ember_chat_messages_message_type_check" CHECK ((message_type = ANY (ARRAY['message'::text, 'tip'::text, 'gift'::text, 'purchase'::text]))) not valid;

alter table "public"."ember_chat_messages" validate constraint "ember_chat_messages_message_type_check";

alter table "public"."ember_chat_messages" add constraint "ember_chat_messages_stream_id_fkey" FOREIGN KEY (stream_id) REFERENCES public.ember_streams(id) ON DELETE CASCADE not valid;

alter table "public"."ember_chat_messages" validate constraint "ember_chat_messages_stream_id_fkey";

alter table "public"."ember_order_details" add constraint "ember_order_details_tx_hash_key" UNIQUE using index "ember_order_details_tx_hash_key";

alter table "public"."hackathons" add constraint "hackathons_tier_check" CHECK ((tier = ANY (ARRAY['I'::text, 'II'::text]))) not valid;

alter table "public"."hackathons" validate constraint "hackathons_tier_check";

alter table "public"."konstant_nicknames" add constraint "konstant_nicknames_owner_address_target_address_key" UNIQUE using index "konstant_nicknames_owner_address_target_address_key";

alter table "public"."labang_chat_messages" add constraint "labang_chat_messages_stream_id_fkey" FOREIGN KEY (stream_id) REFERENCES public.labang_streams(id) ON DELETE CASCADE not valid;

alter table "public"."labang_chat_messages" validate constraint "labang_chat_messages_stream_id_fkey";

alter table "public"."labang_chat_messages" add constraint "labang_chat_messages_type_check" CHECK ((type = ANY (ARRAY['message'::text, 'gift'::text, 'system'::text]))) not valid;

alter table "public"."labang_chat_messages" validate constraint "labang_chat_messages_type_check";

alter table "public"."labang_daily_earnings" add constraint "labang_daily_earnings_user_address_date_key" UNIQUE using index "labang_daily_earnings_user_address_date_key";

alter table "public"."labang_orders" add constraint "labang_orders_onchain_order_id_key" UNIQUE using index "labang_orders_onchain_order_id_key";

alter table "public"."labang_orders" add constraint "labang_orders_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.labang_products(id) ON DELETE SET NULL not valid;

alter table "public"."labang_orders" validate constraint "labang_orders_product_id_fkey";

alter table "public"."labang_orders" add constraint "labang_orders_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.labang_sellers(id) ON DELETE SET NULL not valid;

alter table "public"."labang_orders" validate constraint "labang_orders_seller_id_fkey";

alter table "public"."labang_orders" add constraint "labang_orders_stream_id_fkey" FOREIGN KEY (stream_id) REFERENCES public.labang_streams(id) ON DELETE SET NULL not valid;

alter table "public"."labang_orders" validate constraint "labang_orders_stream_id_fkey";

alter table "public"."labang_products" add constraint "labang_products_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.labang_sellers(id) ON DELETE CASCADE not valid;

alter table "public"."labang_products" validate constraint "labang_products_seller_id_fkey";

alter table "public"."labang_reviews" add constraint "labang_reviews_onchain_review_id_key" UNIQUE using index "labang_reviews_onchain_review_id_key";

alter table "public"."labang_reviews" add constraint "labang_reviews_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.labang_orders(id) ON DELETE SET NULL not valid;

alter table "public"."labang_reviews" validate constraint "labang_reviews_order_id_fkey";

alter table "public"."labang_reviews" add constraint "labang_reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.labang_products(id) ON DELETE CASCADE not valid;

alter table "public"."labang_reviews" validate constraint "labang_reviews_product_id_fkey";

alter table "public"."labang_reviews" add constraint "labang_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."labang_reviews" validate constraint "labang_reviews_rating_check";

alter table "public"."labang_rewards" add constraint "labang_rewards_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.labang_orders(id) ON DELETE SET NULL not valid;

alter table "public"."labang_rewards" validate constraint "labang_rewards_order_id_fkey";

alter table "public"."labang_rewards" add constraint "labang_rewards_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.labang_reviews(id) ON DELETE SET NULL not valid;

alter table "public"."labang_rewards" validate constraint "labang_rewards_review_id_fkey";

alter table "public"."labang_rewards" add constraint "labang_rewards_reward_type_check" CHECK ((reward_type = ANY (ARRAY['watch_5min'::text, 'watch_30min'::text, 'comment'::text, 'review'::text, 'first_purchase'::text]))) not valid;

alter table "public"."labang_rewards" validate constraint "labang_rewards_reward_type_check";

alter table "public"."labang_rewards" add constraint "labang_rewards_stream_id_fkey" FOREIGN KEY (stream_id) REFERENCES public.labang_streams(id) ON DELETE SET NULL not valid;

alter table "public"."labang_rewards" validate constraint "labang_rewards_stream_id_fkey";

alter table "public"."labang_sellers" add constraint "labang_sellers_wallet_address_key" UNIQUE using index "labang_sellers_wallet_address_key";

alter table "public"."labang_stream_products" add constraint "labang_stream_products_stream_id_fkey" FOREIGN KEY (stream_id) REFERENCES public.labang_streams(id) ON DELETE CASCADE not valid;

alter table "public"."labang_stream_products" validate constraint "labang_stream_products_stream_id_fkey";

alter table "public"."labang_stream_products" add constraint "labang_stream_products_stream_id_product_id_key" UNIQUE using index "labang_stream_products_stream_id_product_id_key";

alter table "public"."labang_streams" add constraint "labang_streams_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.labang_sellers(id) ON DELETE CASCADE not valid;

alter table "public"."labang_streams" validate constraint "labang_streams_seller_id_fkey";

alter table "public"."labang_streams" add constraint "labang_streams_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'live'::text, 'ended'::text]))) not valid;

alter table "public"."labang_streams" validate constraint "labang_streams_status_check";

alter table "public"."labang_streams" add constraint "labang_streams_stream_key_key" UNIQUE using index "labang_streams_stream_key_key";

alter table "public"."labang_watch_sessions" add constraint "labang_watch_sessions_stream_id_fkey" FOREIGN KEY (stream_id) REFERENCES public.labang_streams(id) ON DELETE CASCADE not valid;

alter table "public"."labang_watch_sessions" validate constraint "labang_watch_sessions_stream_id_fkey";

alter table "public"."liquidity_history" add constraint "liquidity_history_action_type_check" CHECK (((action_type)::text = ANY ((ARRAY['deposit'::character varying, 'withdraw'::character varying])::text[]))) not valid;

alter table "public"."liquidity_history" validate constraint "liquidity_history_action_type_check";

alter table "public"."meetings" add constraint "meetings_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."meetings" validate constraint "meetings_business_id_fkey";

alter table "public"."meetings" add constraint "meetings_google_event_id_key" UNIQUE using index "meetings_google_event_id_key";

alter table "public"."meetings" add constraint "meetings_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text]))) not valid;

alter table "public"."meetings" validate constraint "meetings_status_check";

alter table "public"."memories" add constraint "memories_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE not valid;

alter table "public"."memories" validate constraint "memories_agent_id_fkey";

alter table "public"."memories" add constraint "memories_confidence_score_check" CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))) not valid;

alter table "public"."memories" validate constraint "memories_confidence_score_check";

alter table "public"."memories" add constraint "memories_importance_level_check" CHECK (((importance_level >= 1) AND (importance_level <= 10))) not valid;

alter table "public"."memories" validate constraint "memories_importance_level_check";

alter table "public"."memories" add constraint "memories_memory_type_check" CHECK ((memory_type = ANY (ARRAY['personality'::text, 'preference'::text, 'conversation'::text, 'behavior_pattern'::text, 'important_event'::text, 'relationship'::text, 'skill'::text, 'context'::text]))) not valid;

alter table "public"."memories" validate constraint "memories_memory_type_check";

alter table "public"."memories" add constraint "memories_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."memories" validate constraint "memories_profile_id_fkey";

alter table "public"."milestones" add constraint "milestones_workflow_id_fkey" FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE not valid;

alter table "public"."milestones" validate constraint "milestones_workflow_id_fkey";

alter table "public"."mocat_ai_ai_agents" add constraint "mocat_ai_ai_agents_agent_id_key" UNIQUE using index "mocat_ai_ai_agents_agent_id_key";

alter table "public"."mocat_ai_ai_agents" add constraint "mocat_ai_ai_agents_developer_id_fkey" FOREIGN KEY (developer_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_ai_agents" validate constraint "mocat_ai_ai_agents_developer_id_fkey";

alter table "public"."mocat_ai_clusters" add constraint "mocat_ai_clusters_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_clusters" validate constraint "mocat_ai_clusters_user_id_fkey";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_cluster_id_fkey" FOREIGN KEY (cluster_id) REFERENCES public.mocat_ai_clusters(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_consensus_records" validate constraint "mocat_ai_consensus_records_cluster_id_fkey";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_consensus_decision_check" CHECK ((consensus_decision = ANY (ARRAY['TAKE'::text, 'MODIFY'::text, 'REJECT'::text]))) not valid;

alter table "public"."mocat_ai_consensus_records" validate constraint "mocat_ai_consensus_records_consensus_decision_check";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_execution_decision_check" CHECK ((execution_decision = ANY (ARRAY['EXECUTE'::text, 'SKIP'::text]))) not valid;

alter table "public"."mocat_ai_consensus_records" validate constraint "mocat_ai_consensus_records_execution_decision_check";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_orchestration_id_key" UNIQUE using index "mocat_ai_consensus_records_orchestration_id_key";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_signal_id_fkey" FOREIGN KEY (signal_id) REFERENCES public.mocat_ai_trading_signals(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_consensus_records" validate constraint "mocat_ai_consensus_records_signal_id_fkey";

alter table "public"."mocat_ai_consensus_records" add constraint "mocat_ai_consensus_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_consensus_records" validate constraint "mocat_ai_consensus_records_user_id_fkey";

alter table "public"."mocat_ai_copy_trading" add constraint "mocat_ai_copy_trading_expert_trader_id_fkey" FOREIGN KEY (expert_trader_id) REFERENCES public.mocat_ai_expert_traders(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_copy_trading" validate constraint "mocat_ai_copy_trading_expert_trader_id_fkey";

alter table "public"."mocat_ai_copy_trading" add constraint "mocat_ai_copy_trading_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_copy_trading" validate constraint "mocat_ai_copy_trading_follower_id_fkey";

alter table "public"."mocat_ai_copy_trading" add constraint "mocat_ai_copy_trading_signal_id_fkey" FOREIGN KEY (signal_id) REFERENCES public.mocat_ai_trading_signals(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_copy_trading" validate constraint "mocat_ai_copy_trading_signal_id_fkey";

alter table "public"."mocat_ai_copy_trading" add constraint "mocat_ai_copy_trading_trade_status_check" CHECK ((trade_status = ANY (ARRAY['ongoing'::text, 'completed'::text]))) not valid;

alter table "public"."mocat_ai_copy_trading" validate constraint "mocat_ai_copy_trading_trade_status_check";

alter table "public"."mocat_ai_expert_traders" add constraint "mocat_ai_expert_traders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_expert_traders" validate constraint "mocat_ai_expert_traders_user_id_fkey";

alter table "public"."mocat_ai_follows" add constraint "mocat_ai_follows_expert_trader_id_fkey" FOREIGN KEY (expert_trader_id) REFERENCES public.mocat_ai_expert_traders(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_follows" validate constraint "mocat_ai_follows_expert_trader_id_fkey";

alter table "public"."mocat_ai_follows" add constraint "mocat_ai_follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_follows" validate constraint "mocat_ai_follows_follower_id_fkey";

alter table "public"."mocat_ai_follows" add constraint "unique_follow_chain" UNIQUE using index "unique_follow_chain";

alter table "public"."mocat_ai_moca_credentials" add constraint "mocat_ai_moca_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.mocat_ai_users(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_moca_credentials" validate constraint "mocat_ai_moca_credentials_user_id_fkey";

alter table "public"."mocat_ai_moca_credentials" add constraint "mocat_ai_moca_credentials_verification_status_check" CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text, 'expired'::text]))) not valid;

alter table "public"."mocat_ai_moca_credentials" validate constraint "mocat_ai_moca_credentials_verification_status_check";

alter table "public"."mocat_ai_signal_validations" add constraint "mocat_ai_signal_validations_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.mocat_ai_ai_agents(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_signal_validations" validate constraint "mocat_ai_signal_validations_agent_id_fkey";

alter table "public"."mocat_ai_signal_validations" add constraint "mocat_ai_signal_validations_confidence_score_check" CHECK (((confidence_score >= 1) AND (confidence_score <= 100))) not valid;

alter table "public"."mocat_ai_signal_validations" validate constraint "mocat_ai_signal_validations_confidence_score_check";

alter table "public"."mocat_ai_signal_validations" add constraint "mocat_ai_signal_validations_signal_id_fkey" FOREIGN KEY (signal_id) REFERENCES public.mocat_ai_trading_signals(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_signal_validations" validate constraint "mocat_ai_signal_validations_signal_id_fkey";

alter table "public"."mocat_ai_signal_validations" add constraint "mocat_ai_signal_validations_validation_result_check" CHECK ((validation_result = ANY (ARRAY['approved'::text, 'rejected'::text, 'neutral'::text]))) not valid;

alter table "public"."mocat_ai_signal_validations" validate constraint "mocat_ai_signal_validations_validation_result_check";

alter table "public"."mocat_ai_trading_signals" add constraint "mocat_ai_trading_signals_confidence_score_check" CHECK (((confidence_score >= 1) AND (confidence_score <= 100))) not valid;

alter table "public"."mocat_ai_trading_signals" validate constraint "mocat_ai_trading_signals_confidence_score_check";

alter table "public"."mocat_ai_trading_signals" add constraint "mocat_ai_trading_signals_direction_check" CHECK ((direction = ANY (ARRAY['long'::text, 'short'::text]))) not valid;

alter table "public"."mocat_ai_trading_signals" validate constraint "mocat_ai_trading_signals_direction_check";

alter table "public"."mocat_ai_trading_signals" add constraint "mocat_ai_trading_signals_expert_trader_id_fkey" FOREIGN KEY (expert_trader_id) REFERENCES public.mocat_ai_expert_traders(id) ON DELETE CASCADE not valid;

alter table "public"."mocat_ai_trading_signals" validate constraint "mocat_ai_trading_signals_expert_trader_id_fkey";

alter table "public"."mocat_ai_trading_signals" add constraint "mocat_ai_trading_signals_trade_status_check" CHECK ((trade_status = ANY (ARRAY['active'::text, 'closed'::text, 'cancelled'::text]))) not valid;

alter table "public"."mocat_ai_trading_signals" validate constraint "mocat_ai_trading_signals_trade_status_check";

alter table "public"."mocat_ai_users" add constraint "mocat_ai_users_smart_account_chain_unique" UNIQUE using index "mocat_ai_users_smart_account_chain_unique";

alter table "public"."mocat_ai_users" add constraint "mocat_ai_users_wallet_chain_unique" UNIQUE using index "mocat_ai_users_wallet_chain_unique";

alter table "public"."notifications" add constraint "notifications_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.agents(id) not valid;

alter table "public"."notifications" validate constraint "notifications_agent_id_fkey";

alter table "public"."notifications" add constraint "notifications_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) not valid;

alter table "public"."notifications" validate constraint "notifications_business_id_fkey";

alter table "public"."notifications" add constraint "notifications_priority_check" CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_priority_check";

alter table "public"."notifications" add constraint "notifications_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notifications" validate constraint "notifications_profile_id_fkey";

alter table "public"."notifications" add constraint "notifications_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) not valid;

alter table "public"."notifications" validate constraint "notifications_project_id_fkey";

alter table "public"."notifications" add constraint "notifications_status_check" CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_status_check";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['missed_call'::text, 'agent_completion'::text, 'project_blocker'::text, 'project_decision'::text, 'project_completion'::text, 'business_meeting'::text, 'business_message'::text, 'business_agent_action'::text, 'finance_transaction'::text, 'finance_fund_shortage'::text, 'hackathon_reminder'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_category_check" CHECK ((category = ANY (ARRAY['social'::text, 'evm'::text, 'solana'::text, 'aptos'::text, 'sui'::text]))) not valid;

alter table "public"."playwright_allocations" validate constraint "playwright_allocations_category_check";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_port_key" UNIQUE using index "playwright_allocations_port_key";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."playwright_allocations" validate constraint "playwright_allocations_project_id_fkey";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_server_id_key" UNIQUE using index "playwright_allocations_server_id_key";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL not valid;

alter table "public"."playwright_allocations" validate constraint "playwright_allocations_session_id_fkey";

alter table "public"."playwright_allocations" add constraint "playwright_allocations_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'allocated'::text, 'error'::text, 'maintenance'::text]))) not valid;

alter table "public"."playwright_allocations" validate constraint "playwright_allocations_status_check";

alter table "public"."project_b2b_clients" add constraint "project_b2b_clients_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."project_b2b_clients" validate constraint "project_b2b_clients_business_id_fkey";

alter table "public"."project_b2b_clients" add constraint "project_b2b_clients_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_b2b_clients" validate constraint "project_b2b_clients_project_id_fkey";

alter table "public"."project_b2b_clients" add constraint "project_b2b_clients_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'trial'::text, 'churned'::text, 'paused'::text]))) not valid;

alter table "public"."project_b2b_clients" validate constraint "project_b2b_clients_status_check";

alter table "public"."project_network_activity" add constraint "project_network_activity_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."project_network_activity" validate constraint "project_network_activity_business_id_fkey";

alter table "public"."project_network_activity" add constraint "project_network_activity_percentage_check" CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric))) not valid;

alter table "public"."project_network_activity" validate constraint "project_network_activity_percentage_check";

alter table "public"."project_network_activity" add constraint "project_network_activity_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_network_activity" validate constraint "project_network_activity_project_id_fkey";

alter table "public"."project_network_activity" add constraint "project_network_activity_project_id_network_key" UNIQUE using index "project_network_activity_project_id_network_key";

alter table "public"."project_onchain_metrics" add constraint "project_onchain_metrics_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."project_onchain_metrics" validate constraint "project_onchain_metrics_business_id_fkey";

alter table "public"."project_onchain_metrics" add constraint "project_onchain_metrics_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_onchain_metrics" validate constraint "project_onchain_metrics_project_id_fkey";

alter table "public"."project_onchain_metrics" add constraint "project_onchain_metrics_project_id_network_key" UNIQUE using index "project_onchain_metrics_project_id_network_key";

alter table "public"."project_onchain_transactions" add constraint "project_onchain_transactions_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."project_onchain_transactions" validate constraint "project_onchain_transactions_business_id_fkey";

alter table "public"."project_onchain_transactions" add constraint "project_onchain_transactions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_onchain_transactions" validate constraint "project_onchain_transactions_project_id_fkey";

alter table "public"."project_onchain_transactions" add constraint "project_onchain_transactions_status_check" CHECK ((status = ANY (ARRAY['confirmed'::text, 'pending'::text, 'failed'::text]))) not valid;

alter table "public"."project_onchain_transactions" validate constraint "project_onchain_transactions_status_check";

alter table "public"."project_social_activities" add constraint "project_social_activities_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."project_social_activities" validate constraint "project_social_activities_business_id_fkey";

alter table "public"."project_social_activities" add constraint "project_social_activities_platform_check" CHECK ((platform = ANY (ARRAY['twitter'::text, 'telegram'::text, 'discord'::text]))) not valid;

alter table "public"."project_social_activities" validate constraint "project_social_activities_platform_check";

alter table "public"."project_social_activities" add constraint "project_social_activities_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_social_activities" validate constraint "project_social_activities_project_id_fkey";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."project_social_metrics" validate constraint "project_social_metrics_business_id_fkey";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_platform_check" CHECK ((platform = ANY (ARRAY['twitter'::text, 'telegram'::text, 'discord'::text]))) not valid;

alter table "public"."project_social_metrics" validate constraint "project_social_metrics_platform_check";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_social_metrics" validate constraint "project_social_metrics_project_id_fkey";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_project_id_platform_key" UNIQUE using index "project_social_metrics_project_id_platform_key";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_sentiment_negative_check" CHECK (((sentiment_negative >= (0)::numeric) AND (sentiment_negative <= (100)::numeric))) not valid;

alter table "public"."project_social_metrics" validate constraint "project_social_metrics_sentiment_negative_check";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_sentiment_neutral_check" CHECK (((sentiment_neutral >= (0)::numeric) AND (sentiment_neutral <= (100)::numeric))) not valid;

alter table "public"."project_social_metrics" validate constraint "project_social_metrics_sentiment_neutral_check";

alter table "public"."project_social_metrics" add constraint "project_social_metrics_sentiment_positive_check" CHECK (((sentiment_positive >= (0)::numeric) AND (sentiment_positive <= (100)::numeric))) not valid;

alter table "public"."project_social_metrics" validate constraint "project_social_metrics_sentiment_positive_check";

alter table "public"."project_wallets" add constraint "project_wallets_ecosystem_check" CHECK ((ecosystem = ANY (ARRAY['evm'::text, 'solana'::text, 'sui'::text, 'aptos'::text, 'cosmos'::text, 'bitcoin'::text, 'cardano'::text, 'near'::text, 'polkadot'::text, 'stellar'::text, 'tezos'::text, 'ton'::text, 'tron'::text, 'doge'::text, 'litecoin'::text, 'starknet'::text, 'xrpl'::text, 'icp'::text, 'injective'::text]))) not valid;

alter table "public"."project_wallets" validate constraint "project_wallets_ecosystem_check";

alter table "public"."project_wallets" add constraint "project_wallets_project_id_chain_key" UNIQUE using index "project_wallets_project_id_chain_key";

alter table "public"."project_wallets" add constraint "project_wallets_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_wallets" validate constraint "project_wallets_project_id_fkey";

alter table "public"."projects" add constraint "projects_association_type_check" CHECK ((association_type = ANY (ARRAY['hackathon'::text, 'business'::text, 'personal'::text]))) not valid;

alter table "public"."projects" validate constraint "projects_association_type_check";

alter table "public"."projects" add constraint "projects_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_business_id_fkey";

alter table "public"."projects" add constraint "projects_framework_id_fkey" FOREIGN KEY (framework_id) REFERENCES public.frameworks(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_framework_id_fkey";

alter table "public"."projects" add constraint "projects_hackathon_id_fkey" FOREIGN KEY (hackathon_id) REFERENCES public.hackathons(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_hackathon_id_fkey";

alter table "public"."projects" add constraint "projects_managing_agent_id_fkey" FOREIGN KEY (managing_agent_id) REFERENCES public.agents(id) not valid;

alter table "public"."projects" validate constraint "projects_managing_agent_id_fkey";

alter table "public"."projects" add constraint "projects_status_check" CHECK ((status = ANY (ARRAY['ideation'::text, 'working'::text, 'stuck'::text, 'completed'::text]))) not valid;

alter table "public"."projects" validate constraint "projects_status_check";

alter table "public"."salvation_conversations" add constraint "salvation_conversations_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.salvation_project_applications(id) ON DELETE CASCADE not valid;

alter table "public"."salvation_conversations" validate constraint "salvation_conversations_application_id_fkey";

alter table "public"."salvation_conversations" add constraint "salvation_conversations_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))) not valid;

alter table "public"."salvation_conversations" validate constraint "salvation_conversations_role_check";

alter table "public"."salvation_ipfs_metadata" add constraint "salvation_ipfs_metadata_cid_key" UNIQUE using index "salvation_ipfs_metadata_cid_key";

alter table "public"."salvation_project_applications" add constraint "salvation_project_applications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'created'::text]))) not valid;

alter table "public"."salvation_project_applications" validate constraint "salvation_project_applications_status_check";

alter table "public"."salvation_project_applications" add constraint "salvation_project_applications_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.salvation_businesses(wallet_address) not valid;

alter table "public"."salvation_project_applications" validate constraint "salvation_project_applications_wallet_address_fkey";

alter table "public"."sentinel_api_keys" add constraint "sentinel_api_keys_key_hash_key" UNIQUE using index "sentinel_api_keys_key_hash_key";

alter table "public"."sentinel_api_keys" add constraint "sentinel_api_keys_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_api_keys" validate constraint "sentinel_api_keys_wallet_address_fkey";

alter table "public"."sentinel_debugger_runs" add constraint "sentinel_debugger_runs_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.sentinel_projects(id) ON DELETE SET NULL not valid;

alter table "public"."sentinel_debugger_runs" validate constraint "sentinel_debugger_runs_project_id_fkey";

alter table "public"."sentinel_debugger_runs" add constraint "sentinel_debugger_runs_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_debugger_runs" validate constraint "sentinel_debugger_runs_wallet_address_fkey";

alter table "public"."sentinel_gas_analyses" add constraint "sentinel_gas_analyses_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.sentinel_projects(id) ON DELETE SET NULL not valid;

alter table "public"."sentinel_gas_analyses" validate constraint "sentinel_gas_analyses_project_id_fkey";

alter table "public"."sentinel_gas_analyses" add constraint "sentinel_gas_analyses_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_gas_analyses" validate constraint "sentinel_gas_analyses_wallet_address_fkey";

alter table "public"."sentinel_projects" add constraint "sentinel_projects_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_projects" validate constraint "sentinel_projects_wallet_address_fkey";

alter table "public"."sentinel_prover_runs" add constraint "sentinel_prover_runs_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.sentinel_projects(id) ON DELETE SET NULL not valid;

alter table "public"."sentinel_prover_runs" validate constraint "sentinel_prover_runs_project_id_fkey";

alter table "public"."sentinel_prover_runs" add constraint "sentinel_prover_runs_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_prover_runs" validate constraint "sentinel_prover_runs_wallet_address_fkey";

alter table "public"."sentinel_simulations" add constraint "sentinel_simulations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.sentinel_projects(id) ON DELETE SET NULL not valid;

alter table "public"."sentinel_simulations" validate constraint "sentinel_simulations_project_id_fkey";

alter table "public"."sentinel_simulations" add constraint "sentinel_simulations_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_simulations" validate constraint "sentinel_simulations_wallet_address_fkey";

alter table "public"."sentinel_team_invites" add constraint "sentinel_team_invites_invite_token_key" UNIQUE using index "sentinel_team_invites_invite_token_key";

alter table "public"."sentinel_team_invites" add constraint "sentinel_team_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_team_invites" validate constraint "sentinel_team_invites_invited_by_fkey";

alter table "public"."sentinel_team_invites" add constraint "sentinel_team_invites_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.sentinel_teams(id) ON DELETE CASCADE not valid;

alter table "public"."sentinel_team_invites" validate constraint "sentinel_team_invites_team_id_fkey";

alter table "public"."sentinel_team_invites" add constraint "sentinel_team_invites_used_by_fkey" FOREIGN KEY (used_by) REFERENCES public.sentinel_users(wallet_address) not valid;

alter table "public"."sentinel_team_invites" validate constraint "sentinel_team_invites_used_by_fkey";

alter table "public"."sentinel_team_members" add constraint "sentinel_team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.sentinel_teams(id) ON DELETE CASCADE not valid;

alter table "public"."sentinel_team_members" validate constraint "sentinel_team_members_team_id_fkey";

alter table "public"."sentinel_team_members" add constraint "sentinel_team_members_team_id_wallet_address_key" UNIQUE using index "sentinel_team_members_team_id_wallet_address_key";

alter table "public"."sentinel_team_members" add constraint "sentinel_team_members_wallet_address_fkey" FOREIGN KEY (wallet_address) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_team_members" validate constraint "sentinel_team_members_wallet_address_fkey";

alter table "public"."sentinel_teams" add constraint "sentinel_teams_owner_wallet_fkey" FOREIGN KEY (owner_wallet) REFERENCES public.sentinel_users(wallet_address) ON DELETE CASCADE not valid;

alter table "public"."sentinel_teams" validate constraint "sentinel_teams_owner_wallet_fkey";

alter table "public"."service_key_audit_log" add constraint "service_key_audit_log_hedera_account_id_fkey" FOREIGN KEY (hedera_account_id) REFERENCES public.vault_fee_accounts(hedera_account_id) not valid;

alter table "public"."service_key_audit_log" validate constraint "service_key_audit_log_hedera_account_id_fkey";

alter table "public"."service_key_audit_log" add constraint "service_key_audit_log_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES auth.users(id) not valid;

alter table "public"."service_key_audit_log" validate constraint "service_key_audit_log_performed_by_fkey";

alter table "public"."sessions" add constraint "sessions_managing_agent_id_fkey" FOREIGN KEY (managing_agent_id) REFERENCES public.agents(id) not valid;

alter table "public"."sessions" validate constraint "sessions_managing_agent_id_fkey";

alter table "public"."sessions" add constraint "sessions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."sessions" validate constraint "sessions_project_id_fkey";

alter table "public"."sessions" add constraint "sessions_session_identifier_key" UNIQUE using index "sessions_session_identifier_key";

alter table "public"."sessions" add constraint "sessions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'terminated'::text]))) not valid;

alter table "public"."sessions" validate constraint "sessions_status_check";

alter table "public"."shinroe_users" add constraint "shinroe_users_address_key" UNIQUE using index "shinroe_users_address_key";

alter table "public"."tangentx_market_stats" add constraint "tangentx_market_stats_market_id_date_key" UNIQUE using index "tangentx_market_stats_market_id_date_key";

alter table "public"."tangentx_market_stats" add constraint "tangentx_market_stats_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.tangentx_markets(id) not valid;

alter table "public"."tangentx_market_stats" validate constraint "tangentx_market_stats_market_id_fkey";

alter table "public"."tangentx_markets" add constraint "tangentx_markets_credential_type_key" UNIQUE using index "tangentx_markets_credential_type_key";

alter table "public"."tangentx_positions" add constraint "tangentx_positions_leverage_check" CHECK (((leverage >= 2) AND (leverage <= 10))) not valid;

alter table "public"."tangentx_positions" validate constraint "tangentx_positions_leverage_check";

alter table "public"."tangentx_positions" add constraint "tangentx_positions_market_id_fkey" FOREIGN KEY (market_id) REFERENCES public.tangentx_markets(id) not valid;

alter table "public"."tangentx_positions" validate constraint "tangentx_positions_market_id_fkey";

alter table "public"."tangentx_positions" add constraint "tangentx_positions_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'liquidated'::text]))) not valid;

alter table "public"."tangentx_positions" validate constraint "tangentx_positions_status_check";

alter table "public"."tangentx_positions" add constraint "tangentx_positions_user_address_fkey" FOREIGN KEY (user_address) REFERENCES public.tangentx_users(address) not valid;

alter table "public"."tangentx_positions" validate constraint "tangentx_positions_user_address_fkey";

alter table "public"."tangentx_trades" add constraint "tangentx_trades_action_check" CHECK ((action = ANY (ARRAY['open'::text, 'close'::text, 'liquidate'::text, 'funding'::text]))) not valid;

alter table "public"."tangentx_trades" validate constraint "tangentx_trades_action_check";

alter table "public"."tangentx_trades" add constraint "tangentx_trades_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public.tangentx_positions(id) not valid;

alter table "public"."tangentx_trades" validate constraint "tangentx_trades_position_id_fkey";

alter table "public"."tangentx_users" add constraint "tangentx_users_address_key" UNIQUE using index "tangentx_users_address_key";

alter table "public"."tangentx_users" add constraint "tangentx_users_referral_code_key" UNIQUE using index "tangentx_users_referral_code_key";

alter table "public"."tangentx_users" add constraint "tangentx_users_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES public.tangentx_users(address) not valid;

alter table "public"."tangentx_users" validate constraint "tangentx_users_referred_by_fkey";

alter table "public"."task_dependencies" add constraint "task_dependencies_depends_on_task_id_fkey" FOREIGN KEY (depends_on_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_dependencies" validate constraint "task_dependencies_depends_on_task_id_fkey";

alter table "public"."task_dependencies" add constraint "task_dependencies_task_id_depends_on_task_id_key" UNIQUE using index "task_dependencies_task_id_depends_on_task_id_key";

alter table "public"."task_dependencies" add constraint "task_dependencies_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_dependencies" validate constraint "task_dependencies_task_id_fkey";

alter table "public"."tasks" add constraint "tasks_milestone_id_fkey" FOREIGN KEY (milestone_id) REFERENCES public.milestones(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_milestone_id_fkey";

alter table "public"."tasks" add constraint "tasks_priority_check" CHECK (((priority >= 1) AND (priority <= 10))) not valid;

alter table "public"."tasks" validate constraint "tasks_priority_check";

alter table "public"."tasks" add constraint "tasks_status_check" CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'blocked'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_status_check";

alter table "public"."testnet_transactions" add constraint "testnet_transactions_category_check" CHECK (((category = 'funding'::text) OR (category IS NULL))) not valid;

alter table "public"."testnet_transactions" validate constraint "testnet_transactions_category_check";

alter table "public"."testnet_transactions" add constraint "testnet_transactions_transaction_hash_key" UNIQUE using index "testnet_transactions_transaction_hash_key";

alter table "public"."testnet_transactions" add constraint "testnet_transactions_type_check" CHECK ((type = ANY (ARRAY['incoming'::text, 'outgoing'::text]))) not valid;

alter table "public"."testnet_transactions" validate constraint "testnet_transactions_type_check";

alter table "public"."testnet_wallets" add constraint "testnet_wallets_address_key" UNIQUE using index "testnet_wallets_address_key";

alter table "public"."transactions" add constraint "transactions_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) not valid;

alter table "public"."transactions" validate constraint "transactions_business_id_fkey";

alter table "public"."transactions" add constraint "transactions_category_check" CHECK ((category = ANY (ARRAY['revenue'::text, 'company_spend'::text, 'dev_spend'::text, 'personal_spend'::text, 'investment_spend'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_category_check";

alter table "public"."transactions" add constraint "transactions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) not valid;

alter table "public"."transactions" validate constraint "transactions_project_id_fkey";

alter table "public"."transactions" add constraint "transactions_transaction_hash_key" UNIQUE using index "transactions_transaction_hash_key";

alter table "public"."transactions" add constraint "transactions_type_check" CHECK ((type = ANY (ARRAY['incoming'::text, 'outgoing'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_type_check";

alter table "public"."transactions" add constraint "transactions_wallet_id_fkey" FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_wallet_id_fkey";

alter table "public"."urejesho_ai_proposals" add constraint "urejesho_ai_proposals_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_ai_proposals" validate constraint "urejesho_ai_proposals_chain_check";

alter table "public"."urejesho_ai_proposals" add constraint "urejesho_ai_proposals_parent_proposal_id_fkey" FOREIGN KEY (parent_proposal_id) REFERENCES public.urejesho_ai_proposals(id) not valid;

alter table "public"."urejesho_ai_proposals" validate constraint "urejesho_ai_proposals_parent_proposal_id_fkey";

alter table "public"."urejesho_ai_proposals" add constraint "urejesho_ai_proposals_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.urejesho_projects(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_ai_proposals" validate constraint "urejesho_ai_proposals_project_id_fkey";

alter table "public"."urejesho_ai_proposals" add constraint "urejesho_ai_proposals_status_check" CHECK ((status = ANY (ARRAY['proposed'::text, 'accepted'::text, 'rejected'::text, 'superseded'::text]))) not valid;

alter table "public"."urejesho_ai_proposals" validate constraint "urejesho_ai_proposals_status_check";

alter table "public"."urejesho_ai_verifications" add constraint "urejesho_ai_verifications_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_ai_verifications" validate constraint "urejesho_ai_verifications_chain_check";

alter table "public"."urejesho_ai_verifications" add constraint "urejesho_ai_verifications_human_review_decision_check" CHECK ((human_review_decision = ANY (ARRAY['confirmed'::text, 'rejected'::text, 'revised'::text]))) not valid;

alter table "public"."urejesho_ai_verifications" validate constraint "urejesho_ai_verifications_human_review_decision_check";

alter table "public"."urejesho_ai_verifications" add constraint "urejesho_ai_verifications_human_reviewer_id_fkey" FOREIGN KEY (human_reviewer_id) REFERENCES public.urejesho_users(id) not valid;

alter table "public"."urejesho_ai_verifications" validate constraint "urejesho_ai_verifications_human_reviewer_id_fkey";

alter table "public"."urejesho_ai_verifications" add constraint "urejesho_ai_verifications_milestone_id_fkey" FOREIGN KEY (milestone_id) REFERENCES public.urejesho_milestones(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_ai_verifications" validate constraint "urejesho_ai_verifications_milestone_id_fkey";

alter table "public"."urejesho_donations" add constraint "urejesho_donations_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_donations" validate constraint "urejesho_donations_chain_check";

alter table "public"."urejesho_donations" add constraint "urejesho_donations_donation_type_check" CHECK ((donation_type = ANY (ARRAY['percentage'::text, 'fixed'::text]))) not valid;

alter table "public"."urejesho_donations" validate constraint "urejesho_donations_donation_type_check";

alter table "public"."urejesho_donations" add constraint "urejesho_donations_hedera_transaction_id_key" UNIQUE using index "urejesho_donations_hedera_transaction_id_key";

alter table "public"."urejesho_donations" add constraint "urejesho_donations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."urejesho_donations" validate constraint "urejesho_donations_status_check";

alter table "public"."urejesho_donations" add constraint "urejesho_donations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.urejesho_users(id) ON DELETE SET NULL not valid;

alter table "public"."urejesho_donations" validate constraint "urejesho_donations_user_id_fkey";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_chain_check";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_check" CHECK ((((storage_type = 'hfs'::text) AND (hfs_file_id IS NOT NULL)) OR ((storage_type = 'ipfs'::text) AND (ipfs_cid IS NOT NULL)) OR ((storage_type = 'hybrid'::text) AND (hfs_file_id IS NOT NULL) AND (ipfs_cid IS NOT NULL)))) not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_check";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_file_type_check" CHECK ((file_type = ANY (ARRAY['ai_analysis'::text, 'ai_verification'::text, 'ngo_document'::text, 'milestone_evidence'::text, 'audit_report'::text]))) not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_file_type_check";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_owner_type_check" CHECK ((owner_type = ANY (ARRAY['user'::text, 'ngo'::text, 'system'::text]))) not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_owner_type_check";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_related_milestone_id_fkey" FOREIGN KEY (related_milestone_id) REFERENCES public.urejesho_milestones(id) ON DELETE SET NULL not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_related_milestone_id_fkey";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_related_ngo_id_fkey" FOREIGN KEY (related_ngo_id) REFERENCES public.urejesho_ngos(id) ON DELETE SET NULL not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_related_ngo_id_fkey";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_related_project_id_fkey" FOREIGN KEY (related_project_id) REFERENCES public.urejesho_projects(id) ON DELETE SET NULL not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_related_project_id_fkey";

alter table "public"."urejesho_file_registry" add constraint "urejesho_file_registry_storage_type_check" CHECK ((storage_type = ANY (ARRAY['hfs'::text, 'ipfs'::text, 'hybrid'::text]))) not valid;

alter table "public"."urejesho_file_registry" validate constraint "urejesho_file_registry_storage_type_check";

alter table "public"."urejesho_global_pool_config" add constraint "urejesho_global_pool_config_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_global_pool_config" validate constraint "urejesho_global_pool_config_chain_check";

alter table "public"."urejesho_global_pool_config" add constraint "urejesho_global_pool_config_chain_key" UNIQUE using index "urejesho_global_pool_config_chain_key";

alter table "public"."urejesho_impact_badges" add constraint "urejesho_impact_badges_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_impact_badges" validate constraint "urejesho_impact_badges_chain_check";

alter table "public"."urejesho_impact_badges" add constraint "urejesho_impact_badges_nft_token_id_key" UNIQUE using index "urejesho_impact_badges_nft_token_id_key";

alter table "public"."urejesho_impact_badges" add constraint "urejesho_impact_badges_tier_check" CHECK ((tier = ANY (ARRAY['seedling'::text, 'sapling'::text, 'tree'::text, 'forest'::text, 'guardian'::text]))) not valid;

alter table "public"."urejesho_impact_badges" validate constraint "urejesho_impact_badges_tier_check";

alter table "public"."urejesho_impact_badges" add constraint "urejesho_impact_badges_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.urejesho_users(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_impact_badges" validate constraint "urejesho_impact_badges_user_id_fkey";

alter table "public"."urejesho_milestones" add constraint "fk_milestone_ai_verification" FOREIGN KEY (ai_verification_id) REFERENCES public.urejesho_ai_verifications(id) not valid;

alter table "public"."urejesho_milestones" validate constraint "fk_milestone_ai_verification";

alter table "public"."urejesho_milestones" add constraint "urejesho_milestones_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_milestones" validate constraint "urejesho_milestones_chain_check";

alter table "public"."urejesho_milestones" add constraint "urejesho_milestones_chain_hedera_milestone_id_key" UNIQUE using index "urejesho_milestones_chain_hedera_milestone_id_key";

alter table "public"."urejesho_milestones" add constraint "urejesho_milestones_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.urejesho_projects(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_milestones" validate constraint "urejesho_milestones_project_id_fkey";

alter table "public"."urejesho_milestones" add constraint "urejesho_milestones_project_id_milestone_number_key" UNIQUE using index "urejesho_milestones_project_id_milestone_number_key";

alter table "public"."urejesho_milestones" add constraint "urejesho_milestones_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'submitted'::text, 'verified'::text, 'rejected'::text, 'funded'::text]))) not valid;

alter table "public"."urejesho_milestones" validate constraint "urejesho_milestones_status_check";

alter table "public"."urejesho_ngo_credentials" add constraint "urejesho_ngo_credentials_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_ngo_credentials" validate constraint "urejesho_ngo_credentials_chain_check";

alter table "public"."urejesho_ngo_credentials" add constraint "urejesho_ngo_credentials_chain_ngo_id_key" UNIQUE using index "urejesho_ngo_credentials_chain_ngo_id_key";

alter table "public"."urejesho_ngo_credentials" add constraint "urejesho_ngo_credentials_credential_id_key" UNIQUE using index "urejesho_ngo_credentials_credential_id_key";

alter table "public"."urejesho_ngo_credentials" add constraint "urejesho_ngo_credentials_ngo_id_fkey" FOREIGN KEY (ngo_id) REFERENCES public.urejesho_ngos(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_ngo_credentials" validate constraint "urejesho_ngo_credentials_ngo_id_fkey";

alter table "public"."urejesho_ngos" add constraint "urejesho_ngos_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_ngos" validate constraint "urejesho_ngos_chain_check";

alter table "public"."urejesho_ngos" add constraint "urejesho_ngos_chain_hedera_account_id_key" UNIQUE using index "urejesho_ngos_chain_hedera_account_id_key";

alter table "public"."urejesho_ngos" add constraint "urejesho_ngos_type_check" CHECK ((type = ANY (ARRAY['non_profit'::text, 'social_enterprise'::text, 'cooperative'::text, 'community_group'::text, 'government'::text, 'other'::text]))) not valid;

alter table "public"."urejesho_ngos" validate constraint "urejesho_ngos_type_check";

alter table "public"."urejesho_ngos" add constraint "urejesho_ngos_verification_status_check" CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'suspended'::text]))) not valid;

alter table "public"."urejesho_ngos" validate constraint "urejesho_ngos_verification_status_check";

alter table "public"."urejesho_project_updates" add constraint "urejesho_project_updates_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_project_updates" validate constraint "urejesho_project_updates_chain_check";

alter table "public"."urejesho_project_updates" add constraint "urejesho_project_updates_ngo_id_fkey" FOREIGN KEY (ngo_id) REFERENCES public.urejesho_ngos(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_project_updates" validate constraint "urejesho_project_updates_ngo_id_fkey";

alter table "public"."urejesho_project_updates" add constraint "urejesho_project_updates_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.urejesho_projects(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_project_updates" validate constraint "urejesho_project_updates_project_id_fkey";

alter table "public"."urejesho_project_updates" add constraint "urejesho_project_updates_related_milestone_id_fkey" FOREIGN KEY (related_milestone_id) REFERENCES public.urejesho_milestones(id) ON DELETE SET NULL not valid;

alter table "public"."urejesho_project_updates" validate constraint "urejesho_project_updates_related_milestone_id_fkey";

alter table "public"."urejesho_projects" add constraint "urejesho_projects_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_projects" validate constraint "urejesho_projects_chain_check";

alter table "public"."urejesho_projects" add constraint "urejesho_projects_ngo_id_fkey" FOREIGN KEY (ngo_id) REFERENCES public.urejesho_ngos(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_projects" validate constraint "urejesho_projects_ngo_id_fkey";

alter table "public"."urejesho_projects" add constraint "urejesho_projects_status_check" CHECK ((status = ANY (ARRAY['voting'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'rejected'::text]))) not valid;

alter table "public"."urejesho_projects" validate constraint "urejesho_projects_status_check";

alter table "public"."urejesho_satellite_imagery" add constraint "urejesho_satellite_imagery_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_satellite_imagery" validate constraint "urejesho_satellite_imagery_chain_check";

alter table "public"."urejesho_satellite_imagery" add constraint "urejesho_satellite_imagery_layer_type_check" CHECK ((layer_type = ANY (ARRAY['true_color'::text, 'ndvi'::text, 'infrastructure'::text, 'false_color'::text]))) not valid;

alter table "public"."urejesho_satellite_imagery" validate constraint "urejesho_satellite_imagery_layer_type_check";

alter table "public"."urejesho_satellite_imagery" add constraint "urejesho_satellite_imagery_milestone_id_fkey" FOREIGN KEY (milestone_id) REFERENCES public.urejesho_milestones(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_satellite_imagery" validate constraint "urejesho_satellite_imagery_milestone_id_fkey";

alter table "public"."urejesho_satellite_imagery" add constraint "urejesho_satellite_imagery_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.urejesho_projects(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_satellite_imagery" validate constraint "urejesho_satellite_imagery_project_id_fkey";

alter table "public"."urejesho_saved_projects" add constraint "urejesho_saved_projects_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_saved_projects" validate constraint "urejesho_saved_projects_chain_check";

alter table "public"."urejesho_saved_projects" add constraint "urejesho_saved_projects_chain_user_hedera_account_id_projec_key" UNIQUE using index "urejesho_saved_projects_chain_user_hedera_account_id_projec_key";

alter table "public"."urejesho_saved_projects" add constraint "urejesho_saved_projects_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.urejesho_projects(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_saved_projects" validate constraint "urejesho_saved_projects_project_id_fkey";

alter table "public"."urejesho_users" add constraint "urejesho_users_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_users" validate constraint "urejesho_users_chain_check";

alter table "public"."urejesho_users" add constraint "urejesho_users_chain_hedera_account_id_key" UNIQUE using index "urejesho_users_chain_hedera_account_id_key";

alter table "public"."urejesho_users" add constraint "urejesho_users_current_badge_tier_check" CHECK ((current_badge_tier = ANY (ARRAY['seedling'::text, 'sapling'::text, 'tree'::text, 'forest'::text, 'guardian'::text]))) not valid;

alter table "public"."urejesho_users" validate constraint "urejesho_users_current_badge_tier_check";

alter table "public"."urejesho_vault_fee_accounts" add constraint "urejesho_vault_fee_accounts_donation_mode_check" CHECK ((donation_mode = ANY (ARRAY['per_transaction'::text, 'monthly'::text]))) not valid;

alter table "public"."urejesho_vault_fee_accounts" validate constraint "urejesho_vault_fee_accounts_donation_mode_check";

alter table "public"."urejesho_vault_fee_accounts" add constraint "urejesho_vault_fee_accounts_monthly_charge_day_check" CHECK (((monthly_charge_day >= 1) AND (monthly_charge_day <= 28))) not valid;

alter table "public"."urejesho_vault_fee_accounts" validate constraint "urejesho_vault_fee_accounts_monthly_charge_day_check";

alter table "public"."urejesho_vault_fee_accounts" add constraint "urejesho_vault_fee_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.urejesho_users(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_vault_fee_accounts" validate constraint "urejesho_vault_fee_accounts_user_id_fkey";

alter table "public"."urejesho_vault_fee_monitoring_state" add constraint "urejesho_vault_fee_monitoring_state_hedera_account_id_fkey" FOREIGN KEY (hedera_account_id) REFERENCES public.urejesho_vault_fee_accounts(hedera_account_id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_vault_fee_monitoring_state" validate constraint "urejesho_vault_fee_monitoring_state_hedera_account_id_fkey";

alter table "public"."urejesho_vault_fee_monthly_schedule" add constraint "urejesho_vault_fee_monthly_sc_hedera_account_id_scheduled_d_key" UNIQUE using index "urejesho_vault_fee_monthly_sc_hedera_account_id_scheduled_d_key";

alter table "public"."urejesho_vault_fee_monthly_schedule" add constraint "urejesho_vault_fee_monthly_schedule_hedera_account_id_fkey" FOREIGN KEY (hedera_account_id) REFERENCES public.urejesho_vault_fee_accounts(hedera_account_id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_vault_fee_monthly_schedule" validate constraint "urejesho_vault_fee_monthly_schedule_hedera_account_id_fkey";

alter table "public"."urejesho_vault_fee_monthly_schedule" add constraint "urejesho_vault_fee_monthly_schedule_hedera_transaction_id_key" UNIQUE using index "urejesho_vault_fee_monthly_schedule_hedera_transaction_id_key";

alter table "public"."urejesho_vault_fee_monthly_schedule" add constraint "urejesho_vault_fee_monthly_schedule_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'skipped'::text]))) not valid;

alter table "public"."urejesho_vault_fee_monthly_schedule" validate constraint "urejesho_vault_fee_monthly_schedule_status_check";

alter table "public"."urejesho_vault_fee_transactions" add constraint "urejesho_vault_fee_transactions_collection_type_check" CHECK ((collection_type = ANY (ARRAY['per_transaction'::text, 'monthly'::text, 'manual'::text]))) not valid;

alter table "public"."urejesho_vault_fee_transactions" validate constraint "urejesho_vault_fee_transactions_collection_type_check";

alter table "public"."urejesho_vault_fee_transactions" add constraint "urejesho_vault_fee_transactions_hedera_account_id_fkey" FOREIGN KEY (hedera_account_id) REFERENCES public.urejesho_vault_fee_accounts(hedera_account_id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_vault_fee_transactions" validate constraint "urejesho_vault_fee_transactions_hedera_account_id_fkey";

alter table "public"."urejesho_vault_fee_transactions" add constraint "urejesho_vault_fee_transactions_hedera_transaction_id_key" UNIQUE using index "urejesho_vault_fee_transactions_hedera_transaction_id_key";

alter table "public"."urejesho_vault_fee_transactions" add constraint "urejesho_vault_fee_transactions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'success'::text, 'failed'::text]))) not valid;

alter table "public"."urejesho_vault_fee_transactions" validate constraint "urejesho_vault_fee_transactions_status_check";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_votes" validate constraint "urejesho_votes_chain_check";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_hcs_message_id_key" UNIQUE using index "urejesho_votes_hcs_message_id_key";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_proposal_id_fkey" FOREIGN KEY (proposal_id) REFERENCES public.urejesho_voting_proposals(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_votes" validate constraint "urejesho_votes_proposal_id_fkey";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_proposal_id_voter_account_id_key" UNIQUE using index "urejesho_votes_proposal_id_voter_account_id_key";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.urejesho_users(id) ON DELETE SET NULL not valid;

alter table "public"."urejesho_votes" validate constraint "urejesho_votes_user_id_fkey";

alter table "public"."urejesho_votes" add constraint "urejesho_votes_vote_choice_check" CHECK ((vote_choice = ANY (ARRAY['accept'::text, 'increase'::text, 'decrease'::text, 'reject'::text]))) not valid;

alter table "public"."urejesho_votes" validate constraint "urejesho_votes_vote_choice_check";

alter table "public"."urejesho_voting_proposals" add constraint "urejesho_voting_proposals_ai_proposal_id_fkey" FOREIGN KEY (ai_proposal_id) REFERENCES public.urejesho_ai_proposals(id) not valid;

alter table "public"."urejesho_voting_proposals" validate constraint "urejesho_voting_proposals_ai_proposal_id_fkey";

alter table "public"."urejesho_voting_proposals" add constraint "urejesho_voting_proposals_chain_check" CHECK ((chain = ANY (ARRAY['testnet'::text, 'mainnet'::text]))) not valid;

alter table "public"."urejesho_voting_proposals" validate constraint "urejesho_voting_proposals_chain_check";

alter table "public"."urejesho_voting_proposals" add constraint "urejesho_voting_proposals_parent_proposal_id_fkey" FOREIGN KEY (parent_proposal_id) REFERENCES public.urejesho_voting_proposals(id) not valid;

alter table "public"."urejesho_voting_proposals" validate constraint "urejesho_voting_proposals_parent_proposal_id_fkey";

alter table "public"."urejesho_voting_proposals" add constraint "urejesho_voting_proposals_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.urejesho_projects(id) ON DELETE CASCADE not valid;

alter table "public"."urejesho_voting_proposals" validate constraint "urejesho_voting_proposals_project_id_fkey";

alter table "public"."urejesho_voting_proposals" add constraint "urejesho_voting_proposals_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'passed'::text, 'rejected'::text, 'cancelled'::text]))) not valid;

alter table "public"."urejesho_voting_proposals" validate constraint "urejesho_voting_proposals_status_check";

alter table "public"."vault_fee_accounts" add constraint "vault_fee_accounts_hedera_account_id_key" UNIQUE using index "vault_fee_accounts_hedera_account_id_key";

alter table "public"."vault_fee_accounts" add constraint "vault_fee_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."vault_fee_accounts" validate constraint "vault_fee_accounts_user_id_fkey";

alter table "public"."vault_fee_transactions" add constraint "vault_fee_transactions_hedera_account_id_fkey" FOREIGN KEY (hedera_account_id) REFERENCES public.vault_fee_accounts(hedera_account_id) not valid;

alter table "public"."vault_fee_transactions" validate constraint "vault_fee_transactions_hedera_account_id_fkey";

alter table "public"."vault_fee_transactions" add constraint "vault_fee_transactions_hedera_transaction_id_key" UNIQUE using index "vault_fee_transactions_hedera_transaction_id_key";

alter table "public"."velox_bid_transactions" add constraint "velox_bid_transactions_bid_tx_hash_key" UNIQUE using index "velox_bid_transactions_bid_tx_hash_key";

alter table "public"."velox_maker_transactions" add constraint "velox_maker_transactions_intent_id_key" UNIQUE using index "velox_maker_transactions_intent_id_key";

alter table "public"."velox_taker_transactions" add constraint "velox_taker_transactions_taker_tx_hash_key" UNIQUE using index "velox_taker_transactions_taker_tx_hash_key";

alter table "public"."wallets" add constraint "wallets_address_key" UNIQUE using index "wallets_address_key";

alter table "public"."workflows" add constraint "workflows_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."workflows" validate constraint "workflows_project_id_fkey";

alter table "public"."yellowdotfun_comment_likes" add constraint "yellowdotfun_comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.yellowdotfun_comments(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_comment_likes" validate constraint "yellowdotfun_comment_likes_comment_id_fkey";

alter table "public"."yellowdotfun_comment_likes" add constraint "yellowdotfun_comment_likes_comment_id_user_address_key" UNIQUE using index "yellowdotfun_comment_likes_comment_id_user_address_key";

alter table "public"."yellowdotfun_comments" add constraint "yellowdotfun_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.yellowdotfun_comments(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_comments" validate constraint "yellowdotfun_comments_parent_comment_id_fkey";

alter table "public"."yellowdotfun_comments" add constraint "yellowdotfun_comments_token_id_fkey" FOREIGN KEY (token_id) REFERENCES public.yellowdotfun_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_comments" validate constraint "yellowdotfun_comments_token_id_fkey";

alter table "public"."yellowdotfun_creator_earnings" add constraint "yellowdotfun_creator_earnings_creator_address_token_id_key" UNIQUE using index "yellowdotfun_creator_earnings_creator_address_token_id_key";

alter table "public"."yellowdotfun_creator_earnings" add constraint "yellowdotfun_creator_earnings_token_id_fkey" FOREIGN KEY (token_id) REFERENCES public.yellowdotfun_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_creator_earnings" validate constraint "yellowdotfun_creator_earnings_token_id_fkey";

alter table "public"."yellowdotfun_tokens" add constraint "yellowdotfun_tokens_creator_fee_percentage_check" CHECK (((creator_fee_percentage >= (0)::numeric) AND (creator_fee_percentage <= (10)::numeric))) not valid;

alter table "public"."yellowdotfun_tokens" validate constraint "yellowdotfun_tokens_creator_fee_percentage_check";

alter table "public"."yellowdotfun_tokens" add constraint "yellowdotfun_tokens_ticker_check" CHECK (((ticker = upper(ticker)) AND ((length(ticker) >= 3) AND (length(ticker) <= 10)))) not valid;

alter table "public"."yellowdotfun_tokens" validate constraint "yellowdotfun_tokens_ticker_check";

alter table "public"."yellowdotfun_tokens" add constraint "yellowdotfun_tokens_ticker_key" UNIQUE using index "yellowdotfun_tokens_ticker_key";

alter table "public"."yellowdotfun_tokens" add constraint "yellowdotfun_tokens_total_supply_check" CHECK ((total_supply > (0)::numeric)) not valid;

alter table "public"."yellowdotfun_tokens" validate constraint "yellowdotfun_tokens_total_supply_check";

alter table "public"."yellowdotfun_top_holders" add constraint "yellowdotfun_top_holders_token_id_fkey" FOREIGN KEY (token_id) REFERENCES public.yellowdotfun_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_top_holders" validate constraint "yellowdotfun_top_holders_token_id_fkey";

alter table "public"."yellowdotfun_top_holders" add constraint "yellowdotfun_top_holders_token_id_user_address_key" UNIQUE using index "yellowdotfun_top_holders_token_id_user_address_key";

alter table "public"."yellowdotfun_trades" add constraint "yellowdotfun_trades_sol_amount_check" CHECK ((sol_amount > (0)::numeric)) not valid;

alter table "public"."yellowdotfun_trades" validate constraint "yellowdotfun_trades_sol_amount_check";

alter table "public"."yellowdotfun_trades" add constraint "yellowdotfun_trades_token_amount_check" CHECK ((token_amount > (0)::numeric)) not valid;

alter table "public"."yellowdotfun_trades" validate constraint "yellowdotfun_trades_token_amount_check";

alter table "public"."yellowdotfun_trades" add constraint "yellowdotfun_trades_token_id_fkey" FOREIGN KEY (token_id) REFERENCES public.yellowdotfun_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_trades" validate constraint "yellowdotfun_trades_token_id_fkey";

alter table "public"."yellowdotfun_trades" add constraint "yellowdotfun_trades_trade_type_check" CHECK ((trade_type = ANY (ARRAY['BUY'::text, 'SELL'::text]))) not valid;

alter table "public"."yellowdotfun_trades" validate constraint "yellowdotfun_trades_trade_type_check";

alter table "public"."yellowdotfun_user_balances" add constraint "yellowdotfun_user_balances_balance_check" CHECK ((balance >= (0)::numeric)) not valid;

alter table "public"."yellowdotfun_user_balances" validate constraint "yellowdotfun_user_balances_balance_check";

alter table "public"."yellowdotfun_user_balances" add constraint "yellowdotfun_user_balances_token_id_fkey" FOREIGN KEY (token_id) REFERENCES public.yellowdotfun_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_user_balances" validate constraint "yellowdotfun_user_balances_token_id_fkey";

alter table "public"."yellowdotfun_user_balances" add constraint "yellowdotfun_user_balances_user_address_token_id_key" UNIQUE using index "yellowdotfun_user_balances_user_address_token_id_key";

alter table "public"."yellowdotfun_watchlist" add constraint "yellowdotfun_watchlist_token_id_fkey" FOREIGN KEY (token_id) REFERENCES public.yellowdotfun_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."yellowdotfun_watchlist" validate constraint "yellowdotfun_watchlist_token_id_fkey";

alter table "public"."yellowdotfun_watchlist" add constraint "yellowdotfun_watchlist_user_address_token_id_key" UNIQUE using index "yellowdotfun_watchlist_user_address_token_id_key";

alter table "public"."yellowperps_level_history" add constraint "yellowperps_level_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.yellowperps_users(id) not valid;

alter table "public"."yellowperps_level_history" validate constraint "yellowperps_level_history_user_id_fkey";

alter table "public"."yellowperps_positions" add constraint "yellowperps_positions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.yellowperps_users(id) not valid;

alter table "public"."yellowperps_positions" validate constraint "yellowperps_positions_user_id_fkey";

alter table "public"."yellowperps_trades" add constraint "yellowperps_trades_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public.yellowperps_positions(id) not valid;

alter table "public"."yellowperps_trades" validate constraint "yellowperps_trades_position_id_fkey";

alter table "public"."yellowperps_trades" add constraint "yellowperps_trades_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.yellowperps_users(id) not valid;

alter table "public"."yellowperps_trades" validate constraint "yellowperps_trades_user_id_fkey";

alter table "public"."yellowperps_transactions" add constraint "yellowperps_transactions_chain_check" CHECK (((chain)::text = ANY ((ARRAY['polygon'::character varying, 'base'::character varying, 'flow-evm'::character varying, 'worldchain'::character varying, 'linea'::character varying, 'yellow'::character varying])::text[]))) not valid;

alter table "public"."yellowperps_transactions" validate constraint "yellowperps_transactions_chain_check";

alter table "public"."yellowperps_transactions" add constraint "yellowperps_transactions_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'success'::character varying, 'failed'::character varying])::text[]))) not valid;

alter table "public"."yellowperps_transactions" validate constraint "yellowperps_transactions_status_check";

alter table "public"."yellowperps_users" add constraint "yellowperps_users_wallet_address_key" UNIQUE using index "yellowperps_users_wallet_address_key";

set check_function_bodies = off;

create or replace view "public"."active_owner_conversations" as  SELECT c.id,
    c.title,
    c.purpose,
    c.status,
    c.priority,
    a.name AS agent_name,
    a.display_name AS agent_display_name,
    a.status AS agent_status,
    a.mood AS agent_mood,
    p.title AS project_title,
    b.name AS business_name,
    c.started_at,
    c.last_message_at,
    ( SELECT jsonb_build_object('message', "left"(ch.message, 100), 'sender', ch.sender, 'type', ch.message_type, 'created_at', ch.created_at) AS jsonb_build_object
           FROM public.chats ch
          WHERE (ch.conversation_id = c.id)
          ORDER BY ch.created_at DESC
         LIMIT 1) AS last_message,
    ( SELECT count(*) AS count
           FROM public.chats ch
          WHERE (ch.conversation_id = c.id)) AS message_count,
    ( SELECT count(*) AS count
           FROM public.chats ch
          WHERE ((ch.conversation_id = c.id) AND (ch.requires_action = true) AND (ch.action_taken = false))) AS pending_actions
   FROM (((public.conversations c
     LEFT JOIN public.agents a ON ((c.agent_id = a.id)))
     LEFT JOIN public.projects p ON ((c.project_id = p.id)))
     LEFT JOIN public.businesses b ON ((c.business_id = b.id)))
  WHERE (c.status = 'active'::text)
  ORDER BY c.last_message_at DESC;


create or replace view "public"."active_playwright_allocations" as  SELECT pa.server_id,
    pa.category,
    pa.port,
    pa.project_id,
    p.title AS project_title,
    pa.session_id,
    pa.allocated_at,
    (EXTRACT(epoch FROM (now() - pa.allocated_at)) / (3600)::numeric) AS hours_allocated
   FROM (public.playwright_allocations pa
     LEFT JOIN public.projects p ON ((pa.project_id = p.id)))
  WHERE (pa.status = 'allocated'::text)
  ORDER BY pa.allocated_at DESC;


CREATE OR REPLACE FUNCTION public.agent_pay_update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.animoca_update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.authorize_vault_fee_allowance(p_hedera_account_id text, p_allowance_amount bigint, p_expires_in_days integer DEFAULT 365)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE urejesho_vault_fee_accounts
  SET
    authorized_allowance = p_allowance_amount,
    remaining_allowance = p_allowance_amount,
    allowance_expires_at = NOW() + (p_expires_in_days || ' days')::INTERVAL
  WHERE hedera_account_id = p_hedera_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_next_monthly_charge(charge_day integer, from_date timestamp with time zone DEFAULT now())
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_month DATE;
  target_date DATE;
  days_in_month INTEGER;
BEGIN
  -- Start with next month
  next_month := DATE_TRUNC('month', from_date) + INTERVAL '1 month';

  -- Get days in that month
  days_in_month := EXTRACT(DAY FROM (next_month + INTERVAL '1 month' - INTERVAL '1 day'));

  -- Use the charge_day or last day of month, whichever is smaller
  target_date := next_month + (LEAST(charge_day, days_in_month) - 1) * INTERVAL '1 day';

  RETURN target_date::TIMESTAMP WITH TIME ZONE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_total_contribution(p_hedera_account_id text, p_days integer DEFAULT 30)
 RETURNS TABLE(total_amount bigint, transaction_count integer, per_transaction_count integer, monthly_count integer, avg_per_transaction numeric, period_start timestamp with time zone, period_end timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    SUM(vault_fee_amount)::BIGINT as total_amount,
    COUNT(*)::INTEGER as transaction_count,
    COUNT(*) FILTER (WHERE collection_type = 'per_transaction')::INTEGER as per_transaction_count,
    COUNT(*) FILTER (WHERE collection_type = 'monthly')::INTEGER as monthly_count,
    AVG(vault_fee_amount) FILTER (WHERE collection_type = 'per_transaction') as avg_per_transaction,
    (NOW() - (p_days || ' days')::INTERVAL) as period_start,
    NOW() as period_end
  FROM urejesho_vault_fee_transactions
  WHERE hedera_account_id = p_hedera_account_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND status = 'success';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_allowance_status(p_hedera_account_id text)
 RETURNS TABLE(authorized_allowance bigint, remaining_allowance bigint, used_allowance bigint, usage_percentage numeric, expires_at timestamp with time zone, days_until_expiry integer, is_expired boolean, needs_renewal boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    a.authorized_allowance,
    a.remaining_allowance,
    (a.authorized_allowance - a.remaining_allowance) as used_allowance,
    CASE
      WHEN a.authorized_allowance > 0
      THEN ROUND(((a.authorized_allowance - a.remaining_allowance)::NUMERIC / a.authorized_allowance::NUMERIC) * 100, 2)
      ELSE 0
    END as usage_percentage,
    a.allowance_expires_at,
    CASE
      WHEN a.allowance_expires_at IS NOT NULL
      THEN EXTRACT(DAY FROM (a.allowance_expires_at - NOW()))::INTEGER
      ELSE NULL
    END as days_until_expiry,
    CASE
      WHEN a.allowance_expires_at IS NOT NULL AND a.allowance_expires_at < NOW()
      THEN true
      ELSE false
    END as is_expired,
    CASE
      WHEN a.allowance_expires_at IS NOT NULL AND a.allowance_expires_at < NOW() + INTERVAL '7 days'
      THEN true
      WHEN a.remaining_allowance < (a.per_transaction_amount * 10)
      THEN true
      ELSE false
    END as needs_renewal
  FROM urejesho_vault_fee_accounts a
  WHERE a.hedera_account_id = p_hedera_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.dxyperps_calculate_liquidation_price(position_type character varying, entry_price numeric, leverage integer, maintenance_margin_rate numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF position_type = 'LONG' THEN
        RETURN entry_price * (1 - (1 - maintenance_margin_rate) / leverage);
    ELSE
        RETURN entry_price * (1 + (1 - maintenance_margin_rate) / leverage);
    END IF;
END;
$function$
;

create or replace view "public"."dxyperps_leaderboard" as  SELECT id,
    wallet_address,
    chain_id,
    username,
    avatar_url,
    total_pnl,
    total_volume,
    total_trades,
    wins,
    losses,
        CASE
            WHEN (total_trades > 0) THEN (((wins)::numeric / (total_trades)::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS win_rate,
        CASE
            WHEN (total_volume > (0)::numeric) THEN ((total_pnl / total_volume) * (100)::numeric)
            ELSE (0)::numeric
        END AS roi_percentage,
    last_trade_at,
    rank() OVER (PARTITION BY chain_id ORDER BY total_pnl DESC) AS pnl_rank,
    rank() OVER (PARTITION BY chain_id ORDER BY (total_pnl / NULLIF(total_volume, (0)::numeric)) DESC) AS roi_rank,
    rank() OVER (PARTITION BY chain_id ORDER BY total_volume DESC) AS volume_rank
   FROM public.dxyperps_traders t
  WHERE ((is_active = true) AND (total_trades > 0))
  ORDER BY total_pnl DESC;


create or replace view "public"."dxyperps_market_stats" as  SELECT m.id,
    m.chain_id,
    m.symbol,
    m.name,
    count(DISTINCT p.trader_id) AS active_traders,
    count(p.id) AS open_positions,
    COALESCE(sum(
        CASE
            WHEN ((p.position_type)::text = 'LONG'::text) THEN (p.size * p.mark_price)
            ELSE (0)::numeric
        END), (0)::numeric) AS long_open_interest,
    COALESCE(sum(
        CASE
            WHEN ((p.position_type)::text = 'SHORT'::text) THEN (p.size * p.mark_price)
            ELSE (0)::numeric
        END), (0)::numeric) AS short_open_interest,
    COALESCE(sum((p.size * p.mark_price)), (0)::numeric) AS total_open_interest,
    ( SELECT COALESCE(sum((o.executed_size * o.executed_price)), (0)::numeric) AS "coalesce"
           FROM public.dxyperps_orders o
          WHERE ((o.market_id = m.id) AND ((o.status)::text = 'FILLED'::text) AND (o.executed_at >= (now() - '24:00:00'::interval)))) AS volume_24h,
    ( SELECT ps.close_price
           FROM public.dxyperps_price_snapshots ps
          WHERE ((ps.market_id = m.id) AND ((ps.timeframe)::text = '1m'::text))
          ORDER BY ps."timestamp" DESC
         LIMIT 1) AS last_price
   FROM (public.dxyperps_markets m
     LEFT JOIN public.dxyperps_positions p ON (((m.id = p.market_id) AND ((p.status)::text = 'OPEN'::text))))
  WHERE (m.is_active = true)
  GROUP BY m.id, m.chain_id, m.symbol, m.name;


create or replace view "public"."dxyperps_positions_summary" as  SELECT p.id,
    p.trader_id,
    p.market_id,
    p.chain_id,
    m.symbol AS market_symbol,
    p.position_type,
    p.size,
    p.entry_price,
    p.mark_price,
    p.liquidation_price,
    p.leverage,
    p.initial_margin,
    p.unrealized_pnl,
        CASE
            WHEN (p.initial_margin > (0)::numeric) THEN ((p.unrealized_pnl / p.initial_margin) * (100)::numeric)
            ELSE (0)::numeric
        END AS pnl_percentage,
    p.margin_ratio,
    p.stop_loss_price,
    p.take_profit_price,
    p.opened_at,
    p.updated_at
   FROM (public.dxyperps_positions p
     JOIN public.dxyperps_markets m ON ((p.market_id = m.id)))
  WHERE ((p.status)::text = 'OPEN'::text);


CREATE OR REPLACE FUNCTION public.dxyperps_update_trader_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status = 'CLOSED' OR NEW.status = 'LIQUIDATED' THEN
        UPDATE dxyperps_traders
        SET
            total_pnl = total_pnl + NEW.realized_pnl,
            total_trades = total_trades + 1,
            wins = CASE WHEN NEW.realized_pnl > 0 THEN wins + 1 ELSE wins END,
            losses = CASE WHEN NEW.realized_pnl <= 0 THEN losses + 1 ELSE losses END,
            last_trade_at = NEW.closed_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.trader_id AND chain_id = NEW.chain_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.dxyperps_update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

create or replace view "public"."finance_summary" as  WITH mainnet_transactions AS (
         SELECT transactions.id,
            transactions.wallet_id,
            transactions.transaction_hash,
            transactions.network,
            transactions.type,
            transactions.amount,
            transactions.currency,
            transactions.amount_usd,
            transactions.from_address,
            transactions.to_address,
            transactions.category,
            transactions.description,
            transactions.business_id,
            transactions.project_id,
            transactions.needs_categorization,
            transactions.metadata,
            transactions.transaction_date,
            transactions.created_at
           FROM public.transactions
          WHERE (transactions.amount_usd IS NOT NULL)
        )
 SELECT sum(
        CASE
            WHEN (category = 'revenue'::text) THEN amount_usd
            ELSE (0)::numeric
        END) AS total_revenue,
    sum(
        CASE
            WHEN (category = ANY (ARRAY['company_spend'::text, 'dev_spend'::text, 'personal_spend'::text, 'investment_spend'::text])) THEN amount_usd
            ELSE (0)::numeric
        END) AS total_spend,
    (sum(
        CASE
            WHEN (category = 'revenue'::text) THEN amount_usd
            ELSE (0)::numeric
        END) - sum(
        CASE
            WHEN (category = ANY (ARRAY['company_spend'::text, 'dev_spend'::text, 'personal_spend'::text, 'investment_spend'::text])) THEN amount_usd
            ELSE (0)::numeric
        END)) AS net_profit,
    jsonb_build_object('monthly', ( SELECT jsonb_object_agg(monthly_data.period, jsonb_build_object('revenue', monthly_data.revenue, 'company_spend', monthly_data.company_spend, 'dev_spend', monthly_data.dev_spend, 'personal_spend', monthly_data.personal_spend, 'investment_spend', monthly_data.investment_spend, 'total_spend', (((monthly_data.company_spend + monthly_data.dev_spend) + monthly_data.personal_spend) + monthly_data.investment_spend), 'net_profit', (monthly_data.revenue - (((monthly_data.company_spend + monthly_data.dev_spend) + monthly_data.personal_spend) + monthly_data.investment_spend)))) AS jsonb_object_agg
           FROM ( SELECT to_char(mainnet_transactions_1.transaction_date, 'YYYY-MM'::text) AS period,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'revenue'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS revenue,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'company_spend'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS company_spend,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'dev_spend'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS dev_spend,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'personal_spend'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS personal_spend,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'investment_spend'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS investment_spend
                   FROM mainnet_transactions mainnet_transactions_1
                  GROUP BY (to_char(mainnet_transactions_1.transaction_date, 'YYYY-MM'::text))) monthly_data), 'quarterly', ( SELECT jsonb_object_agg(quarterly_data.period, jsonb_build_object('revenue', quarterly_data.revenue, 'total_spend', quarterly_data.total_spend, 'net_profit', (quarterly_data.revenue - quarterly_data.total_spend))) AS jsonb_object_agg
           FROM ( SELECT to_char(mainnet_transactions_1.transaction_date, 'YYYY-"Q"Q'::text) AS period,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'revenue'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS revenue,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category ~~ '%spend'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS total_spend
                   FROM mainnet_transactions mainnet_transactions_1
                  GROUP BY (to_char(mainnet_transactions_1.transaction_date, 'YYYY-"Q"Q'::text))) quarterly_data), 'yearly', ( SELECT jsonb_object_agg(yearly_data.period, jsonb_build_object('revenue', yearly_data.revenue, 'total_spend', yearly_data.total_spend, 'net_profit', (yearly_data.revenue - yearly_data.total_spend))) AS jsonb_object_agg
           FROM ( SELECT to_char(mainnet_transactions_1.transaction_date, 'YYYY'::text) AS period,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category = 'revenue'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS revenue,
                    sum(
                        CASE
                            WHEN (mainnet_transactions_1.category ~~ '%spend'::text) THEN mainnet_transactions_1.amount_usd
                            ELSE (0)::numeric
                        END) AS total_spend
                   FROM mainnet_transactions mainnet_transactions_1
                  GROUP BY (to_char(mainnet_transactions_1.transaction_date, 'YYYY'::text))) yearly_data)) AS periods
   FROM mainnet_transactions;


create type "public"."geometry_dump" as ("path" integer[], "geom" public.geometry);

CREATE OR REPLACE FUNCTION public.get_accounts_for_monitoring()
 RETURNS TABLE(hedera_account_id text, per_transaction_amount bigint, remaining_allowance bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    a.hedera_account_id,
    a.per_transaction_amount,
    a.remaining_allowance
  FROM urejesho_vault_fee_accounts a
  WHERE a.is_active = true
    AND a.threshold_key_enabled = true
    AND a.per_transaction_enabled = true
    AND a.remaining_allowance > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_global_vault_fee_stats()
 RETURNS TABLE(total_accounts integer, active_accounts integer, per_transaction_accounts integer, monthly_accounts integer, total_fees_collected_tinybars bigint, total_fees_collected_hbar numeric, total_transactions integer, avg_per_transaction_amount numeric, avg_monthly_amount numeric, last_24h_fees bigint, last_24h_transactions integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_accounts,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_accounts,
    COUNT(*) FILTER (WHERE per_transaction_enabled = true)::INTEGER as per_transaction_accounts,
    COUNT(*) FILTER (WHERE monthly_enabled = true)::INTEGER as monthly_accounts,
    SUM(a.total_fees_collected)::BIGINT as total_fees_collected_tinybars,
    ROUND((SUM(a.total_fees_collected)::NUMERIC / 100000000), 6) as total_fees_collected_hbar,
    SUM(a.transaction_count)::INTEGER as total_transactions,
    AVG(a.per_transaction_amount) as avg_per_transaction_amount,
    AVG(a.monthly_amount) as avg_monthly_amount,
    COALESCE(SUM(t.vault_fee_amount) FILTER (WHERE t.created_at >= NOW() - INTERVAL '24 hours'), 0)::BIGINT as last_24h_fees,
    COUNT(t.*) FILTER (WHERE t.created_at >= NOW() - INTERVAL '24 hours')::INTEGER as last_24h_transactions
  FROM urejesho_vault_fee_accounts a
  LEFT JOIN urejesho_vault_fee_transactions t ON a.hedera_account_id = t.hedera_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_vault_fee_transactions(p_account_id text, p_limit integer DEFAULT 10)
 RETURNS TABLE(tx_id text, amount bigint, status text, tx_timestamp timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    hedera_transaction_id,
    vault_fee_amount,
    status::TEXT,
    consensus_timestamp
  FROM vault_fee_transactions
  WHERE hedera_account_id = p_account_id
  ORDER BY consensus_timestamp DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_monthly_schedule(p_hedera_account_id text, p_months_ahead integer DEFAULT 12)
 RETURNS TABLE(id uuid, scheduled_date date, amount bigint, status text, hedera_transaction_id text, completed_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scheduled_date,
    s.amount,
    s.status,
    s.hedera_transaction_id,
    s.completed_at
  FROM urejesho_vault_fee_monthly_schedule s
  WHERE s.hedera_account_id = p_hedera_account_id
    AND s.scheduled_date >= CURRENT_DATE
    AND s.scheduled_date <= CURRENT_DATE + (p_months_ahead || ' months')::INTERVAL
  ORDER BY s.scheduled_date ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_vault_fee_history(p_hedera_account_id text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, hedera_transaction_id text, collection_type text, vault_fee_amount bigint, original_transaction_id text, status text, consensus_timestamp timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.hedera_transaction_id,
    t.collection_type,
    t.vault_fee_amount,
    t.original_transaction_id,
    t.status,
    t.consensus_timestamp,
    t.created_at
  FROM urejesho_vault_fee_transactions t
  WHERE t.hedera_account_id = p_hedera_account_id
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_vault_fee_account_stats(p_account_id text)
 RETURNS TABLE(account_id text, total_donated bigint, tx_count integer, avg_fee numeric, is_active boolean, last_tx timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    hedera_account_id,
    total_fees_collected,
    transaction_count,
    CASE
      WHEN transaction_count > 0
      THEN ROUND(total_fees_collected::NUMERIC / transaction_count, 0)
      ELSE 0
    END,
    is_active,
    last_transaction_at
  FROM vault_fee_accounts
  WHERE hedera_account_id = p_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_vault_fee_stats(p_hedera_account_id text, p_fee_amount bigint, p_transaction_type text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE urejesho_vault_fee_accounts
  SET
    total_fees_collected = total_fees_collected + p_fee_amount,
    transaction_count = CASE
      WHEN p_transaction_type = 'per_transaction' THEN transaction_count + 1
      ELSE transaction_count
    END,
    monthly_charge_count = CASE
      WHEN p_transaction_type = 'monthly' THEN monthly_charge_count + 1
      ELSE monthly_charge_count
    END,
    remaining_allowance = CASE
      WHEN authorized_allowance > 0 THEN GREATEST(0, remaining_allowance - p_fee_amount)
      ELSE remaining_allowance
    END,
    last_transaction_at = NOW()
  WHERE hedera_account_id = p_hedera_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.labang_update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."liquidity_pool_stats" as  SELECT day,
    count(*) AS daily_actions,
    count(
        CASE
            WHEN ((action_type)::text = 'deposit'::text) THEN 1
            ELSE NULL::integer
        END) AS daily_deposits,
    count(
        CASE
            WHEN ((action_type)::text = 'withdraw'::text) THEN 1
            ELSE NULL::integer
        END) AS daily_withdrawals,
    sum(
        CASE
            WHEN ((action_type)::text = 'deposit'::text) THEN amount_usdc
            ELSE (0)::numeric
        END) AS daily_deposits_usdc,
    sum(
        CASE
            WHEN ((action_type)::text = 'withdraw'::text) THEN amount_usdc
            ELSE (0)::numeric
        END) AS daily_withdrawals_usdc,
    avg(lp_token_price) AS avg_lp_token_price,
    ( SELECT lh.pool_tvl_after
           FROM public.liquidity_history lh
          WHERE (date_trunc('day'::text, lh."timestamp") = grouped_data.day)
          ORDER BY lh."timestamp" DESC
         LIMIT 1) AS end_of_day_tvl
   FROM ( SELECT date_trunc('day'::text, liquidity_history."timestamp") AS day,
            liquidity_history.action_type,
            liquidity_history.amount_usdc,
            liquidity_history.lp_token_price
           FROM public.liquidity_history) grouped_data
  GROUP BY day
  ORDER BY day DESC;


create or replace view "public"."liquidity_user_stats" as  SELECT wallet_address,
    count(*) AS total_actions,
    count(
        CASE
            WHEN ((action_type)::text = 'deposit'::text) THEN 1
            ELSE NULL::integer
        END) AS total_deposits,
    count(
        CASE
            WHEN ((action_type)::text = 'withdraw'::text) THEN 1
            ELSE NULL::integer
        END) AS total_withdrawals,
    sum(
        CASE
            WHEN ((action_type)::text = 'deposit'::text) THEN amount_usdc
            ELSE (0)::numeric
        END) AS total_deposited_usdc,
    sum(
        CASE
            WHEN ((action_type)::text = 'withdraw'::text) THEN amount_usdc
            ELSE (0)::numeric
        END) AS total_withdrawn_usdc,
    ( SELECT lh.total_lp_balance_after
           FROM public.liquidity_history lh
          WHERE ((lh.wallet_address)::text = (liquidity_history.wallet_address)::text)
          ORDER BY lh."timestamp" DESC
         LIMIT 1) AS current_lp_balance,
    min("timestamp") AS first_action,
    max("timestamp") AS last_action
   FROM public.liquidity_history
  GROUP BY wallet_address;


create or replace view "public"."mocat_ai_agent_performance" as  SELECT ag.id,
    ag.developer_id,
    ag.agent_name,
    ag.agent_description,
    ag.tee_deployment_url,
    ag.agent_version,
    ag.tee_logic_hash,
    ag.total_validations,
    ag.wins,
    ag.losses,
    ag.per_analysis_fee,
    ag.total_revenue,
    ag.available_revenue,
    ag.is_active,
    ag.deployed_at,
    ag.updated_at,
    ag.image_url,
    ag.is_testnet,
    ag.chain_id,
    u.display_name AS developer_name,
        CASE
            WHEN ((ag.wins + ag.losses) > 0) THEN (((ag.wins)::numeric / ((ag.wins + ag.losses))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS accuracy_rate,
    ag.available_revenue AS claimable_revenue
   FROM (public.mocat_ai_ai_agents ag
     JOIN public.mocat_ai_users u ON (((ag.developer_id = u.id) AND (ag.chain_id = u.chain_id))))
  WHERE (ag.is_active = true)
  ORDER BY
        CASE
            WHEN ((ag.wins + ag.losses) > 0) THEN (((ag.wins)::numeric / ((ag.wins + ag.losses))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END DESC, ag.total_validations DESC;


create or replace view "public"."mocat_ai_expert_leaderboard" as  SELECT et.id,
    et.user_id,
    et.total_followers,
    et.total_signals_posted,
    et.wins,
    et.losses,
    et.total_win_amount,
    et.total_loss_amount,
    et.profit_cut,
    et.available_revenue,
    et.reputation_score,
    et.bio,
    et.is_verified,
    et.verification_date,
    et.created_at,
    et.is_testnet,
    et.chain_id,
    u.display_name,
    u.wallet_address,
    count(DISTINCT ct.follower_id) AS current_followers,
        CASE
            WHEN ((et.wins + et.losses) > 0) THEN (((et.wins)::numeric / ((et.wins + et.losses))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS win_rate,
    avg(sv.confidence_score) AS avg_agent_confidence
   FROM ((((public.mocat_ai_expert_traders et
     JOIN public.mocat_ai_users u ON (((et.user_id = u.id) AND (et.chain_id = u.chain_id))))
     LEFT JOIN public.mocat_ai_copy_trading ct ON (((et.id = ct.expert_trader_id) AND (ct.trade_status = 'completed'::text) AND (ct.chain_id = et.chain_id))))
     LEFT JOIN public.mocat_ai_trading_signals ts ON (((et.id = ts.expert_trader_id) AND (ts.chain_id = et.chain_id))))
     LEFT JOIN public.mocat_ai_signal_validations sv ON (((ts.id = sv.signal_id) AND (sv.chain_id = ts.chain_id))))
  WHERE (et.is_verified = true)
  GROUP BY et.id, u.display_name, u.wallet_address
  ORDER BY et.reputation_score DESC,
        CASE
            WHEN ((et.wins + et.losses) > 0) THEN (((et.wins)::numeric / ((et.wins + et.losses))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END DESC;


CREATE OR REPLACE FUNCTION public.opt_in_vault_fee(p_account_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE vault_fee_accounts
  SET
    is_active = true,
    opt_out_reason = NULL,
    opted_out_at = NULL,
    updated_at = NOW()
  WHERE hedera_account_id = p_account_id
    AND threshold_key_enabled = true;

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.opt_out_vault_fee(p_account_id text, p_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE vault_fee_accounts
  SET
    is_active = false,
    opt_out_reason = p_reason,
    opted_out_at = NOW(),
    updated_at = NOW()
  WHERE hedera_account_id = p_account_id
    AND is_active = true;

  RETURN FOUND;
END;
$function$
;

create or replace view "public"."owner_conversation_stats" as  SELECT a.name AS agent_name,
    a.display_name AS agent_display_name,
    count(DISTINCT c.id) AS total_conversations,
    count(DISTINCT c.id) FILTER (WHERE (c.status = 'active'::text)) AS active_conversations,
    count(DISTINCT c.id) FILTER (WHERE (c.status = 'completed'::text)) AS completed_conversations,
    avg(c.agent_performance_rating) AS avg_performance_rating,
    count(DISTINCT ch.id) AS total_messages,
    count(DISTINCT ch.id) FILTER (WHERE (ch.sender = 'owner'::text)) AS owner_messages,
    count(DISTINCT ch.id) FILTER (WHERE (ch.sender = 'agent'::text)) AS agent_messages,
    count(DISTINCT ch.id) FILTER (WHERE (ch.message_type = 'command'::text)) AS total_commands,
    count(DISTINCT ch.id) FILTER (WHERE ((ch.requires_action = true) AND (ch.action_taken = false))) AS pending_actions,
    max(c.last_message_at) AS last_activity
   FROM ((public.agents a
     LEFT JOIN public.conversations c ON ((a.id = c.agent_id)))
     LEFT JOIN public.chats ch ON ((c.id = ch.conversation_id)))
  GROUP BY a.id, a.name, a.display_name;


CREATE OR REPLACE FUNCTION public.pause_vault_fee(p_hedera_account_id text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE urejesho_vault_fee_accounts
  SET
    is_active = false,
    pause_reason = p_reason,
    paused_at = NOW()
  WHERE hedera_account_id = p_hedera_account_id;

  -- Stop monitoring
  UPDATE urejesho_vault_fee_monitoring_state
  SET
    is_monitoring = false,
    monitoring_stopped_at = NOW()
  WHERE hedera_account_id = p_hedera_account_id;
END;
$function$
;

create or replace view "public"."playwright_allocation_status" as  SELECT category,
    count(*) AS total_instances,
    count(*) FILTER (WHERE (status = 'available'::text)) AS available_instances,
    count(*) FILTER (WHERE (status = 'allocated'::text)) AS allocated_instances,
    count(*) FILTER (WHERE (status = 'error'::text)) AS error_instances,
    count(*) FILTER (WHERE (status = 'maintenance'::text)) AS maintenance_instances,
    round((((count(*) FILTER (WHERE (status = 'allocated'::text)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS utilization_percentage
   FROM public.playwright_allocations
  GROUP BY category;


create or replace view "public"."project_status_summary" as  SELECT p.id,
    p.title,
    p.description,
    p.image_url,
    p.managing_agent_id,
    a.name AS agent_name,
    p.business_id,
    b.name AS business_name,
    p.hackathon_id,
    h.name AS hackathon_name,
    p.association_type,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM ((public.tasks t
                 JOIN public.milestones m ON ((t.milestone_id = m.id)))
                 JOIN public.workflows w ON ((m.workflow_id = w.id)))
              WHERE ((w.project_id = p.id) AND (t.status = 'blocked'::text)))) THEN 'stuck'::text
            WHEN (EXISTS ( SELECT 1
               FROM ((public.tasks t
                 JOIN public.milestones m ON ((t.milestone_id = m.id)))
                 JOIN public.workflows w ON ((m.workflow_id = w.id)))
              WHERE ((w.project_id = p.id) AND (t.status = 'in_progress'::text)))) THEN 'working'::text
            WHEN (NOT (EXISTS ( SELECT 1
               FROM public.workflows w
              WHERE (w.project_id = p.id)))) THEN 'ideating'::text
            WHEN (NOT (EXISTS ( SELECT 1
               FROM ((public.tasks t
                 JOIN public.milestones m ON ((t.milestone_id = m.id)))
                 JOIN public.workflows w ON ((m.workflow_id = w.id)))
              WHERE ((w.project_id = p.id) AND (t.status <> 'completed'::text))))) THEN 'completed'::text
            ELSE 'working'::text
        END AS status,
    COALESCE(( SELECT round(avg(
                CASE
                    WHEN (workflow_progress.task_count = 0) THEN (0)::numeric
                    ELSE (((workflow_progress.completed_count)::numeric / (workflow_progress.task_count)::numeric) * (100)::numeric)
                END), 0) AS round
           FROM ( SELECT w.id,
                    count(t.id) AS task_count,
                    count(
                        CASE
                            WHEN (t.status = 'completed'::text) THEN 1
                            ELSE NULL::integer
                        END) AS completed_count
                   FROM ((public.workflows w
                     LEFT JOIN public.milestones m ON ((w.id = m.workflow_id)))
                     LEFT JOIN public.tasks t ON ((m.id = t.milestone_id)))
                  WHERE (w.project_id = p.id)
                  GROUP BY w.id) workflow_progress), (0)::numeric) AS progress,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', w.id, 'title', w.title, 'description', w.description, 'task_count', COALESCE(task_stats.task_count, (0)::bigint), 'completed_count', COALESCE(task_stats.completed_count, (0)::bigint), 'status',
                CASE
                    WHEN (task_stats.blocked_count > 0) THEN 'stuck'::text
                    WHEN (task_stats.in_progress_count > 0) THEN 'working'::text
                    WHEN ((task_stats.task_count = task_stats.completed_count) AND (task_stats.task_count > 0)) THEN 'completed'::text
                    ELSE 'ideating'::text
                END)) AS jsonb_agg
           FROM (public.workflows w
             LEFT JOIN LATERAL ( SELECT count(t.id) AS task_count,
                    count(
                        CASE
                            WHEN (t.status = 'completed'::text) THEN 1
                            ELSE NULL::integer
                        END) AS completed_count,
                    count(
                        CASE
                            WHEN (t.status = 'blocked'::text) THEN 1
                            ELSE NULL::integer
                        END) AS blocked_count,
                    count(
                        CASE
                            WHEN (t.status = 'in_progress'::text) THEN 1
                            ELSE NULL::integer
                        END) AS in_progress_count
                   FROM (public.milestones m
                     LEFT JOIN public.tasks t ON ((m.id = t.milestone_id)))
                  WHERE (m.workflow_id = w.id)) task_stats ON (true))
          WHERE (w.project_id = p.id)), '[]'::jsonb) AS workflows,
    p.tags,
    p.public_url,
    p.is_template,
    p.started_at,
    p.completed_at,
    p.created_at,
    p.updated_at
   FROM (((public.projects p
     LEFT JOIN public.agents a ON ((p.managing_agent_id = a.id)))
     LEFT JOIN public.businesses b ON ((p.business_id = b.id)))
     LEFT JOIN public.hackathons h ON ((p.hackathon_id = h.id)));


create or replace view "public"."project_wallet_summary" as  SELECT pw.id,
    pw.project_id,
    p.title AS project_title,
    pw.chain,
    pw.ecosystem,
    pw.address,
    pw.balance,
    pw.last_funded_at,
    pw.total_funded,
    pw.funding_count,
    pw.created_at
   FROM (public.project_wallets pw
     LEFT JOIN public.projects p ON ((p.id = pw.project_id)))
  ORDER BY pw.created_at DESC;


create or replace view "public"."recent_transactions" as  SELECT t.id,
    t.type,
    t.description,
    t.amount,
    t.currency,
    t.amount_usd,
    t.category,
    t.transaction_date,
    t.transaction_hash,
    t.from_address,
    t.to_address,
    t.needs_categorization,
    w.name AS wallet_name,
    w.chain AS wallet_chain,
    w.doxxed AS wallet_doxxed,
    b.name AS business_name,
    p.title AS project_title
   FROM (((public.transactions t
     LEFT JOIN public.wallets w ON ((t.wallet_id = w.id)))
     LEFT JOIN public.businesses b ON ((t.business_id = b.id)))
     LEFT JOIN public.projects p ON ((t.project_id = p.id)))
  ORDER BY t.transaction_date DESC
 LIMIT 500;


create or replace view "public"."recent_vault_fee_transactions" as  SELECT vft.id,
    vft.hedera_transaction_id,
    vft.hedera_account_id,
    vft.vault_fee_amount,
    vft.status,
    vft.consensus_timestamp,
    vfa.user_id
   FROM (public.vault_fee_transactions vft
     JOIN public.vault_fee_accounts vfa ON ((vft.hedera_account_id = vfa.hedera_account_id)))
  ORDER BY vft.consensus_timestamp DESC
 LIMIT 100;


CREATE OR REPLACE FUNCTION public.release_stale_playwright_allocations()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  released_count INTEGER;
BEGIN
  UPDATE playwright_allocations
  SET 
    status = 'available',
    project_id = NULL,
    session_id = NULL,
    released_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'allocated' 
    AND allocated_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resume_vault_fee(p_hedera_account_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE urejesho_vault_fee_accounts
  SET
    is_active = true,
    pause_reason = NULL,
    paused_at = NULL
  WHERE hedera_account_id = p_hedera_account_id;

  -- Resume monitoring
  UPDATE urejesho_vault_fee_monitoring_state
  SET
    is_monitoring = true,
    monitoring_started_at = NOW(),
    monitoring_stopped_at = NULL
  WHERE hedera_account_id = p_hedera_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.salvation_update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.schedule_next_monthly_charge(p_hedera_account_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_account RECORD;
  v_next_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get account settings
  SELECT * INTO v_account
  FROM urejesho_vault_fee_accounts
  WHERE hedera_account_id = p_hedera_account_id
    AND monthly_enabled = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate next charge date
  v_next_date := calculate_next_monthly_charge(
    v_account.monthly_charge_day,
    COALESCE(v_account.next_monthly_charge, NOW())
  );

  -- Insert schedule (if not exists)
  INSERT INTO urejesho_vault_fee_monthly_schedule (
    hedera_account_id,
    scheduled_date,
    amount,
    status
  )
  VALUES (
    p_hedera_account_id,
    v_next_date::DATE,
    v_account.monthly_amount,
    'scheduled'
  )
  ON CONFLICT (hedera_account_id, scheduled_date) DO NOTHING;

  -- Update next_monthly_charge in accounts table
  UPDATE urejesho_vault_fee_accounts
  SET next_monthly_charge = v_next_date
  WHERE hedera_account_id = p_hedera_account_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sentinel_update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create or replace view "public"."spending_breakdown" as  SELECT category,
    sum(amount_usd) AS total_amount,
    count(*) AS transaction_count,
    avg(amount_usd) AS avg_transaction,
    min(transaction_date) AS first_transaction,
    max(transaction_date) AS last_transaction
   FROM public.transactions
  WHERE ((category = ANY (ARRAY['company_spend'::text, 'dev_spend'::text, 'personal_spend'::text, 'investment_spend'::text])) AND (amount_usd IS NOT NULL))
  GROUP BY category;


CREATE OR REPLACE FUNCTION public.update_ai_agent_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE mocat_ai_ai_agents
    SET
        total_validations = total_validations + 1,
        wins = wins + CASE WHEN NEW.validation_result = 'approved' THEN 1 ELSE 0 END,
        losses = losses + CASE WHEN NEW.validation_result = 'rejected' THEN 1 ELSE 0 END
    WHERE id = NEW.agent_id AND chain_id = NEW.chain_id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_circle_total_staked()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE chingu_stake_circles 
        SET total_staked = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM chingu_stake_positions 
            WHERE circle_id = NEW.circle_id AND status = 'active'
        )
        WHERE id = NEW.circle_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chingu_stake_circles 
        SET total_staked = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM chingu_stake_positions 
            WHERE circle_id = OLD.circle_id AND status = 'active'
        )
        WHERE id = OLD.circle_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ember_order_details_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_expert_trader_followers()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_active = true THEN
            UPDATE mocat_ai_expert_traders
            SET total_followers = total_followers + 1
            WHERE id = NEW.expert_trader_id AND chain_id = NEW.chain_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE mocat_ai_expert_traders
            SET total_followers = total_followers + 1
            WHERE id = NEW.expert_trader_id AND chain_id = NEW.chain_id;
        ELSIF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE mocat_ai_expert_traders
            SET total_followers = GREATEST(total_followers - 1, 0)
            WHERE id = NEW.expert_trader_id AND chain_id = NEW.chain_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.is_active = true THEN
            UPDATE mocat_ai_expert_traders
            SET total_followers = GREATEST(total_followers - 1, 0)
            WHERE id = OLD.expert_trader_id AND chain_id = OLD.chain_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_expert_trader_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.trade_status = 'closed' AND OLD.trade_status = 'active' THEN
        UPDATE mocat_ai_expert_traders
        SET
            wins = wins + CASE WHEN NEW.pnl_percentage > 0 THEN 1 ELSE 0 END,
            losses = losses + CASE WHEN NEW.pnl_percentage <= 0 THEN 1 ELSE 0 END,
            total_win_amount = total_win_amount + CASE WHEN NEW.pnl_percentage > 0 THEN NEW.pnl_percentage ELSE 0 END,
            total_loss_amount = total_loss_amount + CASE WHEN NEW.pnl_percentage <= 0 THEN ABS(NEW.pnl_percentage) ELSE 0 END
        WHERE id = NEW.expert_trader_id AND chain_id = NEW.chain_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_file_registry_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_kaiju_pnl()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_positions INTEGER;
    profitable_positions INTEGER;
    total_pnl NUMERIC;
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        -- Count total and profitable positions for this trade
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN profit_loss > 0 THEN 1 END),
            COALESCE(AVG(profit_loss), 0)
        INTO total_positions, profitable_positions, total_pnl
        FROM kaiju_no_69_shadow_positions
        WHERE trade_id = NEW.id AND status = 'closed';

        -- Update kaiju stats
        IF total_pnl > 0 THEN
            UPDATE kaiju_no_69_kaijus
            SET wins = wins + 1,
                avg_pnl_percentage = (
                    SELECT AVG(
                        CASE 
                            WHEN sp.allocated_amount > 0 THEN (sp.profit_loss / sp.allocated_amount) * 100
                            ELSE 0
                        END
                    )
                    FROM kaiju_no_69_shadow_positions sp
                    JOIN kaiju_no_69_trades t ON sp.trade_id = t.id
                    WHERE t.kaiju_id = NEW.kaiju_id AND t.status = 'closed'
                )
            WHERE id = NEW.kaiju_id;
        ELSE
            UPDATE kaiju_no_69_kaijus
            SET losses = losses + 1,
                avg_pnl_percentage = (
                    SELECT AVG(
                        CASE 
                            WHEN sp.allocated_amount > 0 THEN (sp.profit_loss / sp.allocated_amount) * 100
                            ELSE 0
                        END
                    )
                    FROM kaiju_no_69_shadow_positions sp
                    JOIN kaiju_no_69_trades t ON sp.trade_id = t.id
                    WHERE t.kaiju_id = NEW.kaiju_id AND t.status = 'closed'
                )
            WHERE id = NEW.kaiju_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_member_total_staked()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE chingu_stake_circle_members 
        SET total_staked = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM chingu_stake_positions 
            WHERE user_id = NEW.user_id 
            AND circle_id = NEW.circle_id 
            AND status = 'active'
        )
        WHERE user_id = NEW.user_id AND circle_id = NEW.circle_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ngo_credentials_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_project_updates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_shadow_total_pnl()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' AND NEW.profit_loss IS NOT NULL THEN
        UPDATE kaiju_no_69_shadows
        SET total_profit_loss = total_profit_loss + NEW.profit_loss
        WHERE id = NEW.shadow_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_vault_fee_account_stats(p_account_id text, p_fee_amount bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE vault_fee_accounts
  SET
    total_fees_collected = total_fees_collected + p_fee_amount,
    transaction_count = transaction_count + 1,
    last_transaction_at = NOW(),
    updated_at = NOW()
  WHERE hedera_account_id = p_account_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Account % not found for stats update', p_account_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_vault_fee_account_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_vault_fee_settings(p_hedera_account_id text, p_donation_mode text DEFAULT NULL::text, p_per_transaction_amount bigint DEFAULT NULL::bigint, p_per_transaction_enabled boolean DEFAULT NULL::boolean, p_monthly_amount bigint DEFAULT NULL::bigint, p_monthly_enabled boolean DEFAULT NULL::boolean, p_monthly_charge_day integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_monthly_enabled BOOLEAN;
  v_new_monthly_enabled BOOLEAN;
BEGIN
  -- Get current monthly_enabled status
  SELECT monthly_enabled INTO v_old_monthly_enabled
  FROM urejesho_vault_fee_accounts
  WHERE hedera_account_id = p_hedera_account_id;

  -- Determine new monthly_enabled status
  v_new_monthly_enabled := COALESCE(p_monthly_enabled, v_old_monthly_enabled);

  -- Update settings
  UPDATE urejesho_vault_fee_accounts
  SET
    donation_mode = COALESCE(p_donation_mode, donation_mode),
    per_transaction_amount = COALESCE(p_per_transaction_amount, per_transaction_amount),
    per_transaction_enabled = COALESCE(p_per_transaction_enabled, per_transaction_enabled),
    monthly_amount = COALESCE(p_monthly_amount, monthly_amount),
    monthly_enabled = v_new_monthly_enabled,
    monthly_charge_day = COALESCE(p_monthly_charge_day, monthly_charge_day)
  WHERE hedera_account_id = p_hedera_account_id;

  -- If monthly was just enabled, schedule next charge
  IF v_new_monthly_enabled = true AND (v_old_monthly_enabled IS NULL OR v_old_monthly_enabled = false) THEN
    PERFORM schedule_next_monthly_charge(p_hedera_account_id);
  END IF;
END;
$function$
;

create or replace view "public"."urejesho_category_distribution" as  SELECT chain,
    category,
    count(id) AS project_count,
    sum(ai_approved_amount_usd) AS total_approved_usd,
    sum(amount_funded_usd) AS total_funded_usd,
    avg(amount_funded_usd) AS avg_funded_usd,
    round(((sum(amount_funded_usd) / NULLIF(sum(sum(amount_funded_usd)) OVER (PARTITION BY chain), (0)::numeric)) * (100)::numeric), 2) AS funding_percentage
   FROM public.urejesho_projects p
  WHERE ((status = ANY (ARRAY['active'::text, 'completed'::text])) AND (category IS NOT NULL))
  GROUP BY chain, category;


create or replace view "public"."urejesho_donation_trends" as  SELECT chain,
    date(consensus_timestamp) AS date,
    count(*) AS transaction_count,
    sum(amount_usd) AS total_amount_usd,
    avg(amount_usd) AS avg_amount_usd,
    count(DISTINCT user_hedera_account_id) AS unique_donors
   FROM public.urejesho_donations
  WHERE (status = 'completed'::text)
  GROUP BY chain, (date(consensus_timestamp))
  ORDER BY (date(consensus_timestamp)) DESC;


create or replace view "public"."urejesho_geographic_distribution" as  SELECT chain,
    country,
    count(id) AS project_count,
    sum(ai_approved_amount_usd) AS total_approved_usd,
    sum(amount_funded_usd) AS total_funded_usd,
    avg(latitude) AS avg_latitude,
    avg(longitude) AS avg_longitude,
    sum(beneficiary_count) AS total_beneficiaries
   FROM public.urejesho_projects p
  WHERE ((status = ANY (ARRAY['active'::text, 'completed'::text])) AND (country IS NOT NULL))
  GROUP BY chain, country;


create or replace view "public"."urejesho_ngo_stats" as  SELECT n.id AS ngo_id,
    n.chain,
    n.name,
    n.logo_url,
    n.country,
    n.verification_status,
    n.email,
    n.website,
    count(p.id) AS total_projects,
    count(p.id) FILTER (WHERE (p.status = 'voting'::text)) AS projects_voting,
    count(p.id) FILTER (WHERE (p.status = 'active'::text)) AS projects_active,
    count(p.id) FILTER (WHERE (p.status = 'completed'::text)) AS projects_completed,
    COALESCE(sum(p.ai_approved_amount_usd), (0)::numeric) AS total_approved_usd,
    COALESCE(sum(p.amount_funded_usd), (0)::numeric) AS total_funded_usd,
    COALESCE(sum(p.beneficiary_count), (0)::bigint) AS total_beneficiaries_reached
   FROM (public.urejesho_ngos n
     LEFT JOIN public.urejesho_projects p ON ((n.id = p.ngo_id)))
  GROUP BY n.id, n.chain, n.name, n.logo_url, n.country, n.verification_status, n.email, n.website;


create or replace view "public"."urejesho_pending_monthly_charges" as  SELECT s.id,
    s.hedera_account_id,
    s.scheduled_date,
    s.amount,
    s.status,
    a.remaining_allowance,
    a.is_active
   FROM (public.urejesho_vault_fee_monthly_schedule s
     JOIN public.urejesho_vault_fee_accounts a ON ((s.hedera_account_id = a.hedera_account_id)))
  WHERE ((s.status = 'scheduled'::text) AND (s.scheduled_date <= CURRENT_DATE) AND (a.is_active = true) AND (a.monthly_enabled = true) AND (a.remaining_allowance >= s.amount));


CREATE OR REPLACE FUNCTION public.urejesho_update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."urejesho_user_vault_fee_dashboard" as  SELECT a.hedera_account_id,
    a.user_id,
    a.threshold_key_enabled,
    a.donation_mode,
    a.per_transaction_amount,
    a.per_transaction_enabled,
    a.monthly_amount,
    a.monthly_enabled,
    a.monthly_charge_day,
    a.next_monthly_charge,
    a.authorized_allowance,
    a.remaining_allowance,
    a.allowance_expires_at,
    a.total_fees_collected,
    a.transaction_count,
    a.monthly_charge_count,
    a.is_active,
    a.pause_reason,
    a.paused_at,
    m.last_checked_consensus_timestamp,
    m.is_monitoring,
    a.created_at,
    a.updated_at
   FROM (public.urejesho_vault_fee_accounts a
     LEFT JOIN public.urejesho_vault_fee_monitoring_state m ON ((a.hedera_account_id = m.hedera_account_id)));


create or replace view "public"."urejesho_vault_fee_stats" as  SELECT count(*) AS total_accounts,
    count(*) FILTER (WHERE (is_active = true)) AS active_accounts,
    count(*) FILTER (WHERE (per_transaction_enabled = true)) AS per_transaction_accounts,
    count(*) FILTER (WHERE (monthly_enabled = true)) AS monthly_accounts,
    sum(total_fees_collected) AS total_fees_collected_tinybars,
    round((sum(total_fees_collected) / (100000000)::numeric), 6) AS total_fees_collected_hbar,
    sum(transaction_count) AS total_transaction_count,
    sum(monthly_charge_count) AS total_monthly_count
   FROM public.urejesho_vault_fee_accounts;


create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" public.geometry);

create or replace view "public"."vault_fee_stats" as  SELECT count(*) AS total_accounts,
    count(*) FILTER (WHERE (threshold_key_enabled = true)) AS enabled_accounts,
    count(*) FILTER (WHERE (is_active = true)) AS active_accounts,
    sum(total_fees_collected) AS total_fees_collected_tinybars,
    sum(transaction_count) AS total_transactions,
    avg(vault_fee_amount) AS avg_vault_fee_amount
   FROM public.vault_fee_accounts;


create or replace view "public"."wallet_portfolio" as  SELECT id,
    name,
    address,
    chain,
    doxxed,
    balance AS native_balance,
    (balance * (2000)::numeric) AS native_balance_usd,
    token_balances,
    ((balance * (2000)::numeric) + COALESCE(( SELECT sum(((token.value ->> 'balance_usd'::text))::numeric) AS sum
           FROM jsonb_array_elements(w.token_balances) token(value)), (0)::numeric)) AS total_value_usd,
    created_at,
    updated_at
   FROM public.wallets w
  ORDER BY ((balance * (2000)::numeric) + COALESCE(( SELECT sum(((token.value ->> 'balance_usd'::text))::numeric) AS sum
           FROM jsonb_array_elements(w.token_balances) token(value)), (0)::numeric)) DESC;


CREATE OR REPLACE FUNCTION public.yellowdotfun_cleanup_token_stats()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
   UPDATE yellowdotfun_tokens t
   SET 
       volume_24h = COALESCE(sub.volume, 0),
       trade_count_24h = COALESCE(sub.count, 0)
   FROM (
       SELECT 
           token_id,
           SUM(sol_amount) as volume,
           COUNT(*) as count
       FROM yellowdotfun_trades
       WHERE timestamp > NOW() - INTERVAL '24 hours'
       GROUP BY token_id
   ) sub
   WHERE t.id = sub.token_id;
   
   UPDATE yellowdotfun_tokens t
   SET volume_7d = COALESCE(sub.volume, 0)
   FROM (
       SELECT 
           token_id,
           SUM(sol_amount) as volume
       FROM yellowdotfun_trades
       WHERE timestamp > NOW() - INTERVAL '7 days'
       GROUP BY token_id
   ) sub
   WHERE t.id = sub.token_id;
END;
$function$
;

create or replace view "public"."yellowdotfun_comments_with_likes" as  SELECT c.id,
    c.token_id,
    c.user_address,
    c.parent_comment_id,
    c.content,
    c.created_at,
    c.edited_at,
    c.is_deleted,
    c.image_url,
    c.likes_count,
        CASE
            WHEN (cl.id IS NOT NULL) THEN true
            ELSE false
        END AS user_liked,
    count(r.id) AS replies_count
   FROM ((public.yellowdotfun_comments c
     LEFT JOIN public.yellowdotfun_comment_likes cl ON ((c.id = cl.comment_id)))
     LEFT JOIN public.yellowdotfun_comments r ON ((c.id = r.parent_comment_id)))
  WHERE ((c.parent_comment_id IS NULL) AND (c.is_deleted = false))
  GROUP BY c.id, cl.id;


CREATE OR REPLACE FUNCTION public.yellowdotfun_update_comment_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE yellowdotfun_comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE yellowdotfun_comments 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.yellowdotfun_update_creator_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   IF NEW.creator_fee_amount > 0 THEN
       INSERT INTO yellowdotfun_creator_earnings (
           creator_address,
           token_id,
           total_fees_earned,
           last_fee_at
       )
       VALUES (
           (SELECT creator_address FROM yellowdotfun_tokens WHERE id = NEW.token_id),
           NEW.token_id,
           NEW.creator_fee_amount,
           NEW.timestamp
       )
       ON CONFLICT (creator_address, token_id)
       DO UPDATE SET
           total_fees_earned = yellowdotfun_creator_earnings.total_fees_earned + NEW.creator_fee_amount,
           last_fee_at = NEW.timestamp;
   END IF;
   
   RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.yellowdotfun_update_holder_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   IF TG_OP = 'UPDATE' THEN
       -- If balance went from 0 to non-zero or vice versa
       IF (OLD.balance = 0 AND NEW.balance > 0) THEN
           UPDATE yellowdotfun_tokens 
           SET holder_count = holder_count + 1 
           WHERE id = NEW.token_id;
       ELSIF (OLD.balance > 0 AND NEW.balance = 0) THEN
           UPDATE yellowdotfun_tokens 
           SET holder_count = holder_count - 1 
           WHERE id = NEW.token_id;
       END IF;
   ELSIF TG_OP = 'INSERT' AND NEW.balance > 0 THEN
       UPDATE yellowdotfun_tokens 
       SET holder_count = holder_count + 1 
       WHERE id = NEW.token_id;
   END IF;
   
   RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.yellowdotfun_update_token_stats_on_trade()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   -- Update volume stats
   UPDATE yellowdotfun_tokens
   SET 
       volume_24h = (
           SELECT COALESCE(SUM(sol_amount), 0)
           FROM yellowdotfun_trades
           WHERE token_id = NEW.token_id
           AND timestamp > NOW() - INTERVAL '24 hours'
       ),
       volume_7d = (
           SELECT COALESCE(SUM(sol_amount), 0)
           FROM yellowdotfun_trades
           WHERE token_id = NEW.token_id
           AND timestamp > NOW() - INTERVAL '7 days'
       ),
       volume_total = volume_total + NEW.sol_amount,
       trade_count_24h = (
           SELECT COUNT(*)
           FROM yellowdotfun_trades
           WHERE token_id = NEW.token_id
           AND timestamp > NOW() - INTERVAL '24 hours'
       ),
       trade_count_total = trade_count_total + 1,
       last_trade_at = NEW.timestamp
   WHERE id = NEW.token_id;
   
   RETURN NEW;
END;
$function$
;

grant delete on table "public"."agent_actions" to "anon";

grant insert on table "public"."agent_actions" to "anon";

grant references on table "public"."agent_actions" to "anon";

grant select on table "public"."agent_actions" to "anon";

grant trigger on table "public"."agent_actions" to "anon";

grant truncate on table "public"."agent_actions" to "anon";

grant update on table "public"."agent_actions" to "anon";

grant delete on table "public"."agent_actions" to "authenticated";

grant insert on table "public"."agent_actions" to "authenticated";

grant references on table "public"."agent_actions" to "authenticated";

grant select on table "public"."agent_actions" to "authenticated";

grant trigger on table "public"."agent_actions" to "authenticated";

grant truncate on table "public"."agent_actions" to "authenticated";

grant update on table "public"."agent_actions" to "authenticated";

grant delete on table "public"."agent_actions" to "service_role";

grant insert on table "public"."agent_actions" to "service_role";

grant references on table "public"."agent_actions" to "service_role";

grant select on table "public"."agent_actions" to "service_role";

grant trigger on table "public"."agent_actions" to "service_role";

grant truncate on table "public"."agent_actions" to "service_role";

grant update on table "public"."agent_actions" to "service_role";

grant delete on table "public"."agent_chats" to "anon";

grant insert on table "public"."agent_chats" to "anon";

grant references on table "public"."agent_chats" to "anon";

grant select on table "public"."agent_chats" to "anon";

grant trigger on table "public"."agent_chats" to "anon";

grant truncate on table "public"."agent_chats" to "anon";

grant update on table "public"."agent_chats" to "anon";

grant delete on table "public"."agent_chats" to "authenticated";

grant insert on table "public"."agent_chats" to "authenticated";

grant references on table "public"."agent_chats" to "authenticated";

grant select on table "public"."agent_chats" to "authenticated";

grant trigger on table "public"."agent_chats" to "authenticated";

grant truncate on table "public"."agent_chats" to "authenticated";

grant update on table "public"."agent_chats" to "authenticated";

grant delete on table "public"."agent_chats" to "service_role";

grant insert on table "public"."agent_chats" to "service_role";

grant references on table "public"."agent_chats" to "service_role";

grant select on table "public"."agent_chats" to "service_role";

grant trigger on table "public"."agent_chats" to "service_role";

grant truncate on table "public"."agent_chats" to "service_role";

grant update on table "public"."agent_chats" to "service_role";

grant delete on table "public"."agent_conversations" to "anon";

grant insert on table "public"."agent_conversations" to "anon";

grant references on table "public"."agent_conversations" to "anon";

grant select on table "public"."agent_conversations" to "anon";

grant trigger on table "public"."agent_conversations" to "anon";

grant truncate on table "public"."agent_conversations" to "anon";

grant update on table "public"."agent_conversations" to "anon";

grant delete on table "public"."agent_conversations" to "authenticated";

grant insert on table "public"."agent_conversations" to "authenticated";

grant references on table "public"."agent_conversations" to "authenticated";

grant select on table "public"."agent_conversations" to "authenticated";

grant trigger on table "public"."agent_conversations" to "authenticated";

grant truncate on table "public"."agent_conversations" to "authenticated";

grant update on table "public"."agent_conversations" to "authenticated";

grant delete on table "public"."agent_conversations" to "service_role";

grant insert on table "public"."agent_conversations" to "service_role";

grant references on table "public"."agent_conversations" to "service_role";

grant select on table "public"."agent_conversations" to "service_role";

grant trigger on table "public"."agent_conversations" to "service_role";

grant truncate on table "public"."agent_conversations" to "service_role";

grant update on table "public"."agent_conversations" to "service_role";

grant delete on table "public"."agent_pay_api_keys" to "anon";

grant insert on table "public"."agent_pay_api_keys" to "anon";

grant references on table "public"."agent_pay_api_keys" to "anon";

grant select on table "public"."agent_pay_api_keys" to "anon";

grant trigger on table "public"."agent_pay_api_keys" to "anon";

grant truncate on table "public"."agent_pay_api_keys" to "anon";

grant update on table "public"."agent_pay_api_keys" to "anon";

grant delete on table "public"."agent_pay_api_keys" to "authenticated";

grant insert on table "public"."agent_pay_api_keys" to "authenticated";

grant references on table "public"."agent_pay_api_keys" to "authenticated";

grant select on table "public"."agent_pay_api_keys" to "authenticated";

grant trigger on table "public"."agent_pay_api_keys" to "authenticated";

grant truncate on table "public"."agent_pay_api_keys" to "authenticated";

grant update on table "public"."agent_pay_api_keys" to "authenticated";

grant delete on table "public"."agent_pay_api_keys" to "service_role";

grant insert on table "public"."agent_pay_api_keys" to "service_role";

grant references on table "public"."agent_pay_api_keys" to "service_role";

grant select on table "public"."agent_pay_api_keys" to "service_role";

grant trigger on table "public"."agent_pay_api_keys" to "service_role";

grant truncate on table "public"."agent_pay_api_keys" to "service_role";

grant update on table "public"."agent_pay_api_keys" to "service_role";

grant delete on table "public"."agent_pay_services" to "anon";

grant insert on table "public"."agent_pay_services" to "anon";

grant references on table "public"."agent_pay_services" to "anon";

grant select on table "public"."agent_pay_services" to "anon";

grant trigger on table "public"."agent_pay_services" to "anon";

grant truncate on table "public"."agent_pay_services" to "anon";

grant update on table "public"."agent_pay_services" to "anon";

grant delete on table "public"."agent_pay_services" to "authenticated";

grant insert on table "public"."agent_pay_services" to "authenticated";

grant references on table "public"."agent_pay_services" to "authenticated";

grant select on table "public"."agent_pay_services" to "authenticated";

grant trigger on table "public"."agent_pay_services" to "authenticated";

grant truncate on table "public"."agent_pay_services" to "authenticated";

grant update on table "public"."agent_pay_services" to "authenticated";

grant delete on table "public"."agent_pay_services" to "service_role";

grant insert on table "public"."agent_pay_services" to "service_role";

grant references on table "public"."agent_pay_services" to "service_role";

grant select on table "public"."agent_pay_services" to "service_role";

grant trigger on table "public"."agent_pay_services" to "service_role";

grant truncate on table "public"."agent_pay_services" to "service_role";

grant update on table "public"."agent_pay_services" to "service_role";

grant delete on table "public"."agent_pay_usage" to "anon";

grant insert on table "public"."agent_pay_usage" to "anon";

grant references on table "public"."agent_pay_usage" to "anon";

grant select on table "public"."agent_pay_usage" to "anon";

grant trigger on table "public"."agent_pay_usage" to "anon";

grant truncate on table "public"."agent_pay_usage" to "anon";

grant update on table "public"."agent_pay_usage" to "anon";

grant delete on table "public"."agent_pay_usage" to "authenticated";

grant insert on table "public"."agent_pay_usage" to "authenticated";

grant references on table "public"."agent_pay_usage" to "authenticated";

grant select on table "public"."agent_pay_usage" to "authenticated";

grant trigger on table "public"."agent_pay_usage" to "authenticated";

grant truncate on table "public"."agent_pay_usage" to "authenticated";

grant update on table "public"."agent_pay_usage" to "authenticated";

grant delete on table "public"."agent_pay_usage" to "service_role";

grant insert on table "public"."agent_pay_usage" to "service_role";

grant references on table "public"."agent_pay_usage" to "service_role";

grant select on table "public"."agent_pay_usage" to "service_role";

grant trigger on table "public"."agent_pay_usage" to "service_role";

grant truncate on table "public"."agent_pay_usage" to "service_role";

grant update on table "public"."agent_pay_usage" to "service_role";

grant delete on table "public"."agents" to "anon";

grant insert on table "public"."agents" to "anon";

grant references on table "public"."agents" to "anon";

grant select on table "public"."agents" to "anon";

grant trigger on table "public"."agents" to "anon";

grant truncate on table "public"."agents" to "anon";

grant update on table "public"."agents" to "anon";

grant delete on table "public"."agents" to "authenticated";

grant insert on table "public"."agents" to "authenticated";

grant references on table "public"."agents" to "authenticated";

grant select on table "public"."agents" to "authenticated";

grant trigger on table "public"."agents" to "authenticated";

grant truncate on table "public"."agents" to "authenticated";

grant update on table "public"."agents" to "authenticated";

grant delete on table "public"."agents" to "service_role";

grant insert on table "public"."agents" to "service_role";

grant references on table "public"."agents" to "service_role";

grant select on table "public"."agents" to "service_role";

grant trigger on table "public"."agents" to "service_role";

grant truncate on table "public"."agents" to "service_role";

grant update on table "public"."agents" to "service_role";

grant delete on table "public"."animoca_credential_schemas" to "anon";

grant insert on table "public"."animoca_credential_schemas" to "anon";

grant references on table "public"."animoca_credential_schemas" to "anon";

grant select on table "public"."animoca_credential_schemas" to "anon";

grant trigger on table "public"."animoca_credential_schemas" to "anon";

grant truncate on table "public"."animoca_credential_schemas" to "anon";

grant update on table "public"."animoca_credential_schemas" to "anon";

grant delete on table "public"."animoca_credential_schemas" to "authenticated";

grant insert on table "public"."animoca_credential_schemas" to "authenticated";

grant references on table "public"."animoca_credential_schemas" to "authenticated";

grant select on table "public"."animoca_credential_schemas" to "authenticated";

grant trigger on table "public"."animoca_credential_schemas" to "authenticated";

grant truncate on table "public"."animoca_credential_schemas" to "authenticated";

grant update on table "public"."animoca_credential_schemas" to "authenticated";

grant delete on table "public"."animoca_credential_schemas" to "service_role";

grant insert on table "public"."animoca_credential_schemas" to "service_role";

grant references on table "public"."animoca_credential_schemas" to "service_role";

grant select on table "public"."animoca_credential_schemas" to "service_role";

grant trigger on table "public"."animoca_credential_schemas" to "service_role";

grant truncate on table "public"."animoca_credential_schemas" to "service_role";

grant update on table "public"."animoca_credential_schemas" to "service_role";

grant delete on table "public"."animoca_credentials" to "anon";

grant insert on table "public"."animoca_credentials" to "anon";

grant references on table "public"."animoca_credentials" to "anon";

grant select on table "public"."animoca_credentials" to "anon";

grant trigger on table "public"."animoca_credentials" to "anon";

grant truncate on table "public"."animoca_credentials" to "anon";

grant update on table "public"."animoca_credentials" to "anon";

grant delete on table "public"."animoca_credentials" to "authenticated";

grant insert on table "public"."animoca_credentials" to "authenticated";

grant references on table "public"."animoca_credentials" to "authenticated";

grant select on table "public"."animoca_credentials" to "authenticated";

grant trigger on table "public"."animoca_credentials" to "authenticated";

grant truncate on table "public"."animoca_credentials" to "authenticated";

grant update on table "public"."animoca_credentials" to "authenticated";

grant delete on table "public"."animoca_credentials" to "service_role";

grant insert on table "public"."animoca_credentials" to "service_role";

grant references on table "public"."animoca_credentials" to "service_role";

grant select on table "public"."animoca_credentials" to "service_role";

grant trigger on table "public"."animoca_credentials" to "service_role";

grant truncate on table "public"."animoca_credentials" to "service_role";

grant update on table "public"."animoca_credentials" to "service_role";

grant delete on table "public"."animoca_influencers" to "anon";

grant insert on table "public"."animoca_influencers" to "anon";

grant references on table "public"."animoca_influencers" to "anon";

grant select on table "public"."animoca_influencers" to "anon";

grant trigger on table "public"."animoca_influencers" to "anon";

grant truncate on table "public"."animoca_influencers" to "anon";

grant update on table "public"."animoca_influencers" to "anon";

grant delete on table "public"."animoca_influencers" to "authenticated";

grant insert on table "public"."animoca_influencers" to "authenticated";

grant references on table "public"."animoca_influencers" to "authenticated";

grant select on table "public"."animoca_influencers" to "authenticated";

grant trigger on table "public"."animoca_influencers" to "authenticated";

grant truncate on table "public"."animoca_influencers" to "authenticated";

grant update on table "public"."animoca_influencers" to "authenticated";

grant delete on table "public"."animoca_influencers" to "service_role";

grant insert on table "public"."animoca_influencers" to "service_role";

grant references on table "public"."animoca_influencers" to "service_role";

grant select on table "public"."animoca_influencers" to "service_role";

grant trigger on table "public"."animoca_influencers" to "service_role";

grant truncate on table "public"."animoca_influencers" to "service_role";

grant update on table "public"."animoca_influencers" to "service_role";

grant delete on table "public"."animoca_trades" to "anon";

grant insert on table "public"."animoca_trades" to "anon";

grant references on table "public"."animoca_trades" to "anon";

grant select on table "public"."animoca_trades" to "anon";

grant trigger on table "public"."animoca_trades" to "anon";

grant truncate on table "public"."animoca_trades" to "anon";

grant update on table "public"."animoca_trades" to "anon";

grant delete on table "public"."animoca_trades" to "authenticated";

grant insert on table "public"."animoca_trades" to "authenticated";

grant references on table "public"."animoca_trades" to "authenticated";

grant select on table "public"."animoca_trades" to "authenticated";

grant trigger on table "public"."animoca_trades" to "authenticated";

grant truncate on table "public"."animoca_trades" to "authenticated";

grant update on table "public"."animoca_trades" to "authenticated";

grant delete on table "public"."animoca_trades" to "service_role";

grant insert on table "public"."animoca_trades" to "service_role";

grant references on table "public"."animoca_trades" to "service_role";

grant select on table "public"."animoca_trades" to "service_role";

grant trigger on table "public"."animoca_trades" to "service_role";

grant truncate on table "public"."animoca_trades" to "service_role";

grant update on table "public"."animoca_trades" to "service_role";

grant delete on table "public"."businesses" to "anon";

grant insert on table "public"."businesses" to "anon";

grant references on table "public"."businesses" to "anon";

grant select on table "public"."businesses" to "anon";

grant trigger on table "public"."businesses" to "anon";

grant truncate on table "public"."businesses" to "anon";

grant update on table "public"."businesses" to "anon";

grant delete on table "public"."businesses" to "authenticated";

grant insert on table "public"."businesses" to "authenticated";

grant references on table "public"."businesses" to "authenticated";

grant select on table "public"."businesses" to "authenticated";

grant trigger on table "public"."businesses" to "authenticated";

grant truncate on table "public"."businesses" to "authenticated";

grant update on table "public"."businesses" to "authenticated";

grant delete on table "public"."businesses" to "service_role";

grant insert on table "public"."businesses" to "service_role";

grant references on table "public"."businesses" to "service_role";

grant select on table "public"."businesses" to "service_role";

grant trigger on table "public"."businesses" to "service_role";

grant truncate on table "public"."businesses" to "service_role";

grant update on table "public"."businesses" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."comm_styles" to "anon";

grant insert on table "public"."comm_styles" to "anon";

grant references on table "public"."comm_styles" to "anon";

grant select on table "public"."comm_styles" to "anon";

grant trigger on table "public"."comm_styles" to "anon";

grant truncate on table "public"."comm_styles" to "anon";

grant update on table "public"."comm_styles" to "anon";

grant delete on table "public"."comm_styles" to "authenticated";

grant insert on table "public"."comm_styles" to "authenticated";

grant references on table "public"."comm_styles" to "authenticated";

grant select on table "public"."comm_styles" to "authenticated";

grant trigger on table "public"."comm_styles" to "authenticated";

grant truncate on table "public"."comm_styles" to "authenticated";

grant update on table "public"."comm_styles" to "authenticated";

grant delete on table "public"."comm_styles" to "service_role";

grant insert on table "public"."comm_styles" to "service_role";

grant references on table "public"."comm_styles" to "service_role";

grant select on table "public"."comm_styles" to "service_role";

grant trigger on table "public"."comm_styles" to "service_role";

grant truncate on table "public"."comm_styles" to "service_role";

grant update on table "public"."comm_styles" to "service_role";

grant delete on table "public"."commands" to "anon";

grant insert on table "public"."commands" to "anon";

grant references on table "public"."commands" to "anon";

grant select on table "public"."commands" to "anon";

grant trigger on table "public"."commands" to "anon";

grant truncate on table "public"."commands" to "anon";

grant update on table "public"."commands" to "anon";

grant delete on table "public"."commands" to "authenticated";

grant insert on table "public"."commands" to "authenticated";

grant references on table "public"."commands" to "authenticated";

grant select on table "public"."commands" to "authenticated";

grant trigger on table "public"."commands" to "authenticated";

grant truncate on table "public"."commands" to "authenticated";

grant update on table "public"."commands" to "authenticated";

grant delete on table "public"."commands" to "service_role";

grant insert on table "public"."commands" to "service_role";

grant references on table "public"."commands" to "service_role";

grant select on table "public"."commands" to "service_role";

grant trigger on table "public"."commands" to "service_role";

grant truncate on table "public"."commands" to "service_role";

grant update on table "public"."commands" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."dxyperps_funding_history" to "anon";

grant insert on table "public"."dxyperps_funding_history" to "anon";

grant references on table "public"."dxyperps_funding_history" to "anon";

grant select on table "public"."dxyperps_funding_history" to "anon";

grant trigger on table "public"."dxyperps_funding_history" to "anon";

grant truncate on table "public"."dxyperps_funding_history" to "anon";

grant update on table "public"."dxyperps_funding_history" to "anon";

grant delete on table "public"."dxyperps_funding_history" to "authenticated";

grant insert on table "public"."dxyperps_funding_history" to "authenticated";

grant references on table "public"."dxyperps_funding_history" to "authenticated";

grant select on table "public"."dxyperps_funding_history" to "authenticated";

grant trigger on table "public"."dxyperps_funding_history" to "authenticated";

grant truncate on table "public"."dxyperps_funding_history" to "authenticated";

grant update on table "public"."dxyperps_funding_history" to "authenticated";

grant delete on table "public"."dxyperps_funding_history" to "service_role";

grant insert on table "public"."dxyperps_funding_history" to "service_role";

grant references on table "public"."dxyperps_funding_history" to "service_role";

grant select on table "public"."dxyperps_funding_history" to "service_role";

grant trigger on table "public"."dxyperps_funding_history" to "service_role";

grant truncate on table "public"."dxyperps_funding_history" to "service_role";

grant update on table "public"."dxyperps_funding_history" to "service_role";

grant delete on table "public"."dxyperps_liquidations" to "anon";

grant insert on table "public"."dxyperps_liquidations" to "anon";

grant references on table "public"."dxyperps_liquidations" to "anon";

grant select on table "public"."dxyperps_liquidations" to "anon";

grant trigger on table "public"."dxyperps_liquidations" to "anon";

grant truncate on table "public"."dxyperps_liquidations" to "anon";

grant update on table "public"."dxyperps_liquidations" to "anon";

grant delete on table "public"."dxyperps_liquidations" to "authenticated";

grant insert on table "public"."dxyperps_liquidations" to "authenticated";

grant references on table "public"."dxyperps_liquidations" to "authenticated";

grant select on table "public"."dxyperps_liquidations" to "authenticated";

grant trigger on table "public"."dxyperps_liquidations" to "authenticated";

grant truncate on table "public"."dxyperps_liquidations" to "authenticated";

grant update on table "public"."dxyperps_liquidations" to "authenticated";

grant delete on table "public"."dxyperps_liquidations" to "service_role";

grant insert on table "public"."dxyperps_liquidations" to "service_role";

grant references on table "public"."dxyperps_liquidations" to "service_role";

grant select on table "public"."dxyperps_liquidations" to "service_role";

grant trigger on table "public"."dxyperps_liquidations" to "service_role";

grant truncate on table "public"."dxyperps_liquidations" to "service_role";

grant update on table "public"."dxyperps_liquidations" to "service_role";

grant delete on table "public"."dxyperps_markets" to "anon";

grant insert on table "public"."dxyperps_markets" to "anon";

grant references on table "public"."dxyperps_markets" to "anon";

grant select on table "public"."dxyperps_markets" to "anon";

grant trigger on table "public"."dxyperps_markets" to "anon";

grant truncate on table "public"."dxyperps_markets" to "anon";

grant update on table "public"."dxyperps_markets" to "anon";

grant delete on table "public"."dxyperps_markets" to "authenticated";

grant insert on table "public"."dxyperps_markets" to "authenticated";

grant references on table "public"."dxyperps_markets" to "authenticated";

grant select on table "public"."dxyperps_markets" to "authenticated";

grant trigger on table "public"."dxyperps_markets" to "authenticated";

grant truncate on table "public"."dxyperps_markets" to "authenticated";

grant update on table "public"."dxyperps_markets" to "authenticated";

grant delete on table "public"."dxyperps_markets" to "service_role";

grant insert on table "public"."dxyperps_markets" to "service_role";

grant references on table "public"."dxyperps_markets" to "service_role";

grant select on table "public"."dxyperps_markets" to "service_role";

grant trigger on table "public"."dxyperps_markets" to "service_role";

grant truncate on table "public"."dxyperps_markets" to "service_role";

grant update on table "public"."dxyperps_markets" to "service_role";

grant delete on table "public"."dxyperps_orders" to "anon";

grant insert on table "public"."dxyperps_orders" to "anon";

grant references on table "public"."dxyperps_orders" to "anon";

grant select on table "public"."dxyperps_orders" to "anon";

grant trigger on table "public"."dxyperps_orders" to "anon";

grant truncate on table "public"."dxyperps_orders" to "anon";

grant update on table "public"."dxyperps_orders" to "anon";

grant delete on table "public"."dxyperps_orders" to "authenticated";

grant insert on table "public"."dxyperps_orders" to "authenticated";

grant references on table "public"."dxyperps_orders" to "authenticated";

grant select on table "public"."dxyperps_orders" to "authenticated";

grant trigger on table "public"."dxyperps_orders" to "authenticated";

grant truncate on table "public"."dxyperps_orders" to "authenticated";

grant update on table "public"."dxyperps_orders" to "authenticated";

grant delete on table "public"."dxyperps_orders" to "service_role";

grant insert on table "public"."dxyperps_orders" to "service_role";

grant references on table "public"."dxyperps_orders" to "service_role";

grant select on table "public"."dxyperps_orders" to "service_role";

grant trigger on table "public"."dxyperps_orders" to "service_role";

grant truncate on table "public"."dxyperps_orders" to "service_role";

grant update on table "public"."dxyperps_orders" to "service_role";

grant delete on table "public"."dxyperps_position_history" to "anon";

grant insert on table "public"."dxyperps_position_history" to "anon";

grant references on table "public"."dxyperps_position_history" to "anon";

grant select on table "public"."dxyperps_position_history" to "anon";

grant trigger on table "public"."dxyperps_position_history" to "anon";

grant truncate on table "public"."dxyperps_position_history" to "anon";

grant update on table "public"."dxyperps_position_history" to "anon";

grant delete on table "public"."dxyperps_position_history" to "authenticated";

grant insert on table "public"."dxyperps_position_history" to "authenticated";

grant references on table "public"."dxyperps_position_history" to "authenticated";

grant select on table "public"."dxyperps_position_history" to "authenticated";

grant trigger on table "public"."dxyperps_position_history" to "authenticated";

grant truncate on table "public"."dxyperps_position_history" to "authenticated";

grant update on table "public"."dxyperps_position_history" to "authenticated";

grant delete on table "public"."dxyperps_position_history" to "service_role";

grant insert on table "public"."dxyperps_position_history" to "service_role";

grant references on table "public"."dxyperps_position_history" to "service_role";

grant select on table "public"."dxyperps_position_history" to "service_role";

grant trigger on table "public"."dxyperps_position_history" to "service_role";

grant truncate on table "public"."dxyperps_position_history" to "service_role";

grant update on table "public"."dxyperps_position_history" to "service_role";

grant delete on table "public"."dxyperps_positions" to "anon";

grant insert on table "public"."dxyperps_positions" to "anon";

grant references on table "public"."dxyperps_positions" to "anon";

grant select on table "public"."dxyperps_positions" to "anon";

grant trigger on table "public"."dxyperps_positions" to "anon";

grant truncate on table "public"."dxyperps_positions" to "anon";

grant update on table "public"."dxyperps_positions" to "anon";

grant delete on table "public"."dxyperps_positions" to "authenticated";

grant insert on table "public"."dxyperps_positions" to "authenticated";

grant references on table "public"."dxyperps_positions" to "authenticated";

grant select on table "public"."dxyperps_positions" to "authenticated";

grant trigger on table "public"."dxyperps_positions" to "authenticated";

grant truncate on table "public"."dxyperps_positions" to "authenticated";

grant update on table "public"."dxyperps_positions" to "authenticated";

grant delete on table "public"."dxyperps_positions" to "service_role";

grant insert on table "public"."dxyperps_positions" to "service_role";

grant references on table "public"."dxyperps_positions" to "service_role";

grant select on table "public"."dxyperps_positions" to "service_role";

grant trigger on table "public"."dxyperps_positions" to "service_role";

grant truncate on table "public"."dxyperps_positions" to "service_role";

grant update on table "public"."dxyperps_positions" to "service_role";

grant delete on table "public"."dxyperps_price_snapshots" to "anon";

grant insert on table "public"."dxyperps_price_snapshots" to "anon";

grant references on table "public"."dxyperps_price_snapshots" to "anon";

grant select on table "public"."dxyperps_price_snapshots" to "anon";

grant trigger on table "public"."dxyperps_price_snapshots" to "anon";

grant truncate on table "public"."dxyperps_price_snapshots" to "anon";

grant update on table "public"."dxyperps_price_snapshots" to "anon";

grant delete on table "public"."dxyperps_price_snapshots" to "authenticated";

grant insert on table "public"."dxyperps_price_snapshots" to "authenticated";

grant references on table "public"."dxyperps_price_snapshots" to "authenticated";

grant select on table "public"."dxyperps_price_snapshots" to "authenticated";

grant trigger on table "public"."dxyperps_price_snapshots" to "authenticated";

grant truncate on table "public"."dxyperps_price_snapshots" to "authenticated";

grant update on table "public"."dxyperps_price_snapshots" to "authenticated";

grant delete on table "public"."dxyperps_price_snapshots" to "service_role";

grant insert on table "public"."dxyperps_price_snapshots" to "service_role";

grant references on table "public"."dxyperps_price_snapshots" to "service_role";

grant select on table "public"."dxyperps_price_snapshots" to "service_role";

grant trigger on table "public"."dxyperps_price_snapshots" to "service_role";

grant truncate on table "public"."dxyperps_price_snapshots" to "service_role";

grant update on table "public"."dxyperps_price_snapshots" to "service_role";

grant delete on table "public"."dxyperps_traders" to "anon";

grant insert on table "public"."dxyperps_traders" to "anon";

grant references on table "public"."dxyperps_traders" to "anon";

grant select on table "public"."dxyperps_traders" to "anon";

grant trigger on table "public"."dxyperps_traders" to "anon";

grant truncate on table "public"."dxyperps_traders" to "anon";

grant update on table "public"."dxyperps_traders" to "anon";

grant delete on table "public"."dxyperps_traders" to "authenticated";

grant insert on table "public"."dxyperps_traders" to "authenticated";

grant references on table "public"."dxyperps_traders" to "authenticated";

grant select on table "public"."dxyperps_traders" to "authenticated";

grant trigger on table "public"."dxyperps_traders" to "authenticated";

grant truncate on table "public"."dxyperps_traders" to "authenticated";

grant update on table "public"."dxyperps_traders" to "authenticated";

grant delete on table "public"."dxyperps_traders" to "service_role";

grant insert on table "public"."dxyperps_traders" to "service_role";

grant references on table "public"."dxyperps_traders" to "service_role";

grant select on table "public"."dxyperps_traders" to "service_role";

grant trigger on table "public"."dxyperps_traders" to "service_role";

grant truncate on table "public"."dxyperps_traders" to "service_role";

grant update on table "public"."dxyperps_traders" to "service_role";

grant delete on table "public"."ember_chat_messages" to "anon";

grant insert on table "public"."ember_chat_messages" to "anon";

grant references on table "public"."ember_chat_messages" to "anon";

grant select on table "public"."ember_chat_messages" to "anon";

grant trigger on table "public"."ember_chat_messages" to "anon";

grant truncate on table "public"."ember_chat_messages" to "anon";

grant update on table "public"."ember_chat_messages" to "anon";

grant delete on table "public"."ember_chat_messages" to "authenticated";

grant insert on table "public"."ember_chat_messages" to "authenticated";

grant references on table "public"."ember_chat_messages" to "authenticated";

grant select on table "public"."ember_chat_messages" to "authenticated";

grant trigger on table "public"."ember_chat_messages" to "authenticated";

grant truncate on table "public"."ember_chat_messages" to "authenticated";

grant update on table "public"."ember_chat_messages" to "authenticated";

grant delete on table "public"."ember_chat_messages" to "service_role";

grant insert on table "public"."ember_chat_messages" to "service_role";

grant references on table "public"."ember_chat_messages" to "service_role";

grant select on table "public"."ember_chat_messages" to "service_role";

grant trigger on table "public"."ember_chat_messages" to "service_role";

grant truncate on table "public"."ember_chat_messages" to "service_role";

grant update on table "public"."ember_chat_messages" to "service_role";

grant delete on table "public"."ember_order_details" to "anon";

grant insert on table "public"."ember_order_details" to "anon";

grant references on table "public"."ember_order_details" to "anon";

grant select on table "public"."ember_order_details" to "anon";

grant trigger on table "public"."ember_order_details" to "anon";

grant truncate on table "public"."ember_order_details" to "anon";

grant update on table "public"."ember_order_details" to "anon";

grant delete on table "public"."ember_order_details" to "authenticated";

grant insert on table "public"."ember_order_details" to "authenticated";

grant references on table "public"."ember_order_details" to "authenticated";

grant select on table "public"."ember_order_details" to "authenticated";

grant trigger on table "public"."ember_order_details" to "authenticated";

grant truncate on table "public"."ember_order_details" to "authenticated";

grant update on table "public"."ember_order_details" to "authenticated";

grant delete on table "public"."ember_order_details" to "service_role";

grant insert on table "public"."ember_order_details" to "service_role";

grant references on table "public"."ember_order_details" to "service_role";

grant select on table "public"."ember_order_details" to "service_role";

grant trigger on table "public"."ember_order_details" to "service_role";

grant truncate on table "public"."ember_order_details" to "service_role";

grant update on table "public"."ember_order_details" to "service_role";

grant delete on table "public"."ember_streams" to "anon";

grant insert on table "public"."ember_streams" to "anon";

grant references on table "public"."ember_streams" to "anon";

grant select on table "public"."ember_streams" to "anon";

grant trigger on table "public"."ember_streams" to "anon";

grant truncate on table "public"."ember_streams" to "anon";

grant update on table "public"."ember_streams" to "anon";

grant delete on table "public"."ember_streams" to "authenticated";

grant insert on table "public"."ember_streams" to "authenticated";

grant references on table "public"."ember_streams" to "authenticated";

grant select on table "public"."ember_streams" to "authenticated";

grant trigger on table "public"."ember_streams" to "authenticated";

grant truncate on table "public"."ember_streams" to "authenticated";

grant update on table "public"."ember_streams" to "authenticated";

grant delete on table "public"."ember_streams" to "service_role";

grant insert on table "public"."ember_streams" to "service_role";

grant references on table "public"."ember_streams" to "service_role";

grant select on table "public"."ember_streams" to "service_role";

grant trigger on table "public"."ember_streams" to "service_role";

grant truncate on table "public"."ember_streams" to "service_role";

grant update on table "public"."ember_streams" to "service_role";

grant delete on table "public"."frameworks" to "anon";

grant insert on table "public"."frameworks" to "anon";

grant references on table "public"."frameworks" to "anon";

grant select on table "public"."frameworks" to "anon";

grant trigger on table "public"."frameworks" to "anon";

grant truncate on table "public"."frameworks" to "anon";

grant update on table "public"."frameworks" to "anon";

grant delete on table "public"."frameworks" to "authenticated";

grant insert on table "public"."frameworks" to "authenticated";

grant references on table "public"."frameworks" to "authenticated";

grant select on table "public"."frameworks" to "authenticated";

grant trigger on table "public"."frameworks" to "authenticated";

grant truncate on table "public"."frameworks" to "authenticated";

grant update on table "public"."frameworks" to "authenticated";

grant delete on table "public"."frameworks" to "service_role";

grant insert on table "public"."frameworks" to "service_role";

grant references on table "public"."frameworks" to "service_role";

grant select on table "public"."frameworks" to "service_role";

grant trigger on table "public"."frameworks" to "service_role";

grant truncate on table "public"."frameworks" to "service_role";

grant update on table "public"."frameworks" to "service_role";

grant delete on table "public"."hackathons" to "anon";

grant insert on table "public"."hackathons" to "anon";

grant references on table "public"."hackathons" to "anon";

grant select on table "public"."hackathons" to "anon";

grant trigger on table "public"."hackathons" to "anon";

grant truncate on table "public"."hackathons" to "anon";

grant update on table "public"."hackathons" to "anon";

grant delete on table "public"."hackathons" to "authenticated";

grant insert on table "public"."hackathons" to "authenticated";

grant references on table "public"."hackathons" to "authenticated";

grant select on table "public"."hackathons" to "authenticated";

grant trigger on table "public"."hackathons" to "authenticated";

grant truncate on table "public"."hackathons" to "authenticated";

grant update on table "public"."hackathons" to "authenticated";

grant delete on table "public"."hackathons" to "service_role";

grant insert on table "public"."hackathons" to "service_role";

grant references on table "public"."hackathons" to "service_role";

grant select on table "public"."hackathons" to "service_role";

grant trigger on table "public"."hackathons" to "service_role";

grant truncate on table "public"."hackathons" to "service_role";

grant update on table "public"."hackathons" to "service_role";

grant delete on table "public"."konstant_nicknames" to "anon";

grant insert on table "public"."konstant_nicknames" to "anon";

grant references on table "public"."konstant_nicknames" to "anon";

grant select on table "public"."konstant_nicknames" to "anon";

grant trigger on table "public"."konstant_nicknames" to "anon";

grant truncate on table "public"."konstant_nicknames" to "anon";

grant update on table "public"."konstant_nicknames" to "anon";

grant delete on table "public"."konstant_nicknames" to "authenticated";

grant insert on table "public"."konstant_nicknames" to "authenticated";

grant references on table "public"."konstant_nicknames" to "authenticated";

grant select on table "public"."konstant_nicknames" to "authenticated";

grant trigger on table "public"."konstant_nicknames" to "authenticated";

grant truncate on table "public"."konstant_nicknames" to "authenticated";

grant update on table "public"."konstant_nicknames" to "authenticated";

grant delete on table "public"."konstant_nicknames" to "service_role";

grant insert on table "public"."konstant_nicknames" to "service_role";

grant references on table "public"."konstant_nicknames" to "service_role";

grant select on table "public"."konstant_nicknames" to "service_role";

grant trigger on table "public"."konstant_nicknames" to "service_role";

grant truncate on table "public"."konstant_nicknames" to "service_role";

grant update on table "public"."konstant_nicknames" to "service_role";

grant delete on table "public"."konstant_profiles" to "anon";

grant insert on table "public"."konstant_profiles" to "anon";

grant references on table "public"."konstant_profiles" to "anon";

grant select on table "public"."konstant_profiles" to "anon";

grant trigger on table "public"."konstant_profiles" to "anon";

grant truncate on table "public"."konstant_profiles" to "anon";

grant update on table "public"."konstant_profiles" to "anon";

grant delete on table "public"."konstant_profiles" to "authenticated";

grant insert on table "public"."konstant_profiles" to "authenticated";

grant references on table "public"."konstant_profiles" to "authenticated";

grant select on table "public"."konstant_profiles" to "authenticated";

grant trigger on table "public"."konstant_profiles" to "authenticated";

grant truncate on table "public"."konstant_profiles" to "authenticated";

grant update on table "public"."konstant_profiles" to "authenticated";

grant delete on table "public"."konstant_profiles" to "service_role";

grant insert on table "public"."konstant_profiles" to "service_role";

grant references on table "public"."konstant_profiles" to "service_role";

grant select on table "public"."konstant_profiles" to "service_role";

grant trigger on table "public"."konstant_profiles" to "service_role";

grant truncate on table "public"."konstant_profiles" to "service_role";

grant update on table "public"."konstant_profiles" to "service_role";

grant delete on table "public"."labang_chat_messages" to "anon";

grant insert on table "public"."labang_chat_messages" to "anon";

grant references on table "public"."labang_chat_messages" to "anon";

grant select on table "public"."labang_chat_messages" to "anon";

grant trigger on table "public"."labang_chat_messages" to "anon";

grant truncate on table "public"."labang_chat_messages" to "anon";

grant update on table "public"."labang_chat_messages" to "anon";

grant delete on table "public"."labang_chat_messages" to "authenticated";

grant insert on table "public"."labang_chat_messages" to "authenticated";

grant references on table "public"."labang_chat_messages" to "authenticated";

grant select on table "public"."labang_chat_messages" to "authenticated";

grant trigger on table "public"."labang_chat_messages" to "authenticated";

grant truncate on table "public"."labang_chat_messages" to "authenticated";

grant update on table "public"."labang_chat_messages" to "authenticated";

grant delete on table "public"."labang_chat_messages" to "service_role";

grant insert on table "public"."labang_chat_messages" to "service_role";

grant references on table "public"."labang_chat_messages" to "service_role";

grant select on table "public"."labang_chat_messages" to "service_role";

grant trigger on table "public"."labang_chat_messages" to "service_role";

grant truncate on table "public"."labang_chat_messages" to "service_role";

grant update on table "public"."labang_chat_messages" to "service_role";

grant delete on table "public"."labang_daily_earnings" to "anon";

grant insert on table "public"."labang_daily_earnings" to "anon";

grant references on table "public"."labang_daily_earnings" to "anon";

grant select on table "public"."labang_daily_earnings" to "anon";

grant trigger on table "public"."labang_daily_earnings" to "anon";

grant truncate on table "public"."labang_daily_earnings" to "anon";

grant update on table "public"."labang_daily_earnings" to "anon";

grant delete on table "public"."labang_daily_earnings" to "authenticated";

grant insert on table "public"."labang_daily_earnings" to "authenticated";

grant references on table "public"."labang_daily_earnings" to "authenticated";

grant select on table "public"."labang_daily_earnings" to "authenticated";

grant trigger on table "public"."labang_daily_earnings" to "authenticated";

grant truncate on table "public"."labang_daily_earnings" to "authenticated";

grant update on table "public"."labang_daily_earnings" to "authenticated";

grant delete on table "public"."labang_daily_earnings" to "service_role";

grant insert on table "public"."labang_daily_earnings" to "service_role";

grant references on table "public"."labang_daily_earnings" to "service_role";

grant select on table "public"."labang_daily_earnings" to "service_role";

grant trigger on table "public"."labang_daily_earnings" to "service_role";

grant truncate on table "public"."labang_daily_earnings" to "service_role";

grant update on table "public"."labang_daily_earnings" to "service_role";

grant delete on table "public"."labang_orders" to "anon";

grant insert on table "public"."labang_orders" to "anon";

grant references on table "public"."labang_orders" to "anon";

grant select on table "public"."labang_orders" to "anon";

grant trigger on table "public"."labang_orders" to "anon";

grant truncate on table "public"."labang_orders" to "anon";

grant update on table "public"."labang_orders" to "anon";

grant delete on table "public"."labang_orders" to "authenticated";

grant insert on table "public"."labang_orders" to "authenticated";

grant references on table "public"."labang_orders" to "authenticated";

grant select on table "public"."labang_orders" to "authenticated";

grant trigger on table "public"."labang_orders" to "authenticated";

grant truncate on table "public"."labang_orders" to "authenticated";

grant update on table "public"."labang_orders" to "authenticated";

grant delete on table "public"."labang_orders" to "service_role";

grant insert on table "public"."labang_orders" to "service_role";

grant references on table "public"."labang_orders" to "service_role";

grant select on table "public"."labang_orders" to "service_role";

grant trigger on table "public"."labang_orders" to "service_role";

grant truncate on table "public"."labang_orders" to "service_role";

grant update on table "public"."labang_orders" to "service_role";

grant delete on table "public"."labang_products" to "anon";

grant insert on table "public"."labang_products" to "anon";

grant references on table "public"."labang_products" to "anon";

grant select on table "public"."labang_products" to "anon";

grant trigger on table "public"."labang_products" to "anon";

grant truncate on table "public"."labang_products" to "anon";

grant update on table "public"."labang_products" to "anon";

grant delete on table "public"."labang_products" to "authenticated";

grant insert on table "public"."labang_products" to "authenticated";

grant references on table "public"."labang_products" to "authenticated";

grant select on table "public"."labang_products" to "authenticated";

grant trigger on table "public"."labang_products" to "authenticated";

grant truncate on table "public"."labang_products" to "authenticated";

grant update on table "public"."labang_products" to "authenticated";

grant delete on table "public"."labang_products" to "service_role";

grant insert on table "public"."labang_products" to "service_role";

grant references on table "public"."labang_products" to "service_role";

grant select on table "public"."labang_products" to "service_role";

grant trigger on table "public"."labang_products" to "service_role";

grant truncate on table "public"."labang_products" to "service_role";

grant update on table "public"."labang_products" to "service_role";

grant delete on table "public"."labang_reviews" to "anon";

grant insert on table "public"."labang_reviews" to "anon";

grant references on table "public"."labang_reviews" to "anon";

grant select on table "public"."labang_reviews" to "anon";

grant trigger on table "public"."labang_reviews" to "anon";

grant truncate on table "public"."labang_reviews" to "anon";

grant update on table "public"."labang_reviews" to "anon";

grant delete on table "public"."labang_reviews" to "authenticated";

grant insert on table "public"."labang_reviews" to "authenticated";

grant references on table "public"."labang_reviews" to "authenticated";

grant select on table "public"."labang_reviews" to "authenticated";

grant trigger on table "public"."labang_reviews" to "authenticated";

grant truncate on table "public"."labang_reviews" to "authenticated";

grant update on table "public"."labang_reviews" to "authenticated";

grant delete on table "public"."labang_reviews" to "service_role";

grant insert on table "public"."labang_reviews" to "service_role";

grant references on table "public"."labang_reviews" to "service_role";

grant select on table "public"."labang_reviews" to "service_role";

grant trigger on table "public"."labang_reviews" to "service_role";

grant truncate on table "public"."labang_reviews" to "service_role";

grant update on table "public"."labang_reviews" to "service_role";

grant delete on table "public"."labang_rewards" to "anon";

grant insert on table "public"."labang_rewards" to "anon";

grant references on table "public"."labang_rewards" to "anon";

grant select on table "public"."labang_rewards" to "anon";

grant trigger on table "public"."labang_rewards" to "anon";

grant truncate on table "public"."labang_rewards" to "anon";

grant update on table "public"."labang_rewards" to "anon";

grant delete on table "public"."labang_rewards" to "authenticated";

grant insert on table "public"."labang_rewards" to "authenticated";

grant references on table "public"."labang_rewards" to "authenticated";

grant select on table "public"."labang_rewards" to "authenticated";

grant trigger on table "public"."labang_rewards" to "authenticated";

grant truncate on table "public"."labang_rewards" to "authenticated";

grant update on table "public"."labang_rewards" to "authenticated";

grant delete on table "public"."labang_rewards" to "service_role";

grant insert on table "public"."labang_rewards" to "service_role";

grant references on table "public"."labang_rewards" to "service_role";

grant select on table "public"."labang_rewards" to "service_role";

grant trigger on table "public"."labang_rewards" to "service_role";

grant truncate on table "public"."labang_rewards" to "service_role";

grant update on table "public"."labang_rewards" to "service_role";

grant delete on table "public"."labang_sellers" to "anon";

grant insert on table "public"."labang_sellers" to "anon";

grant references on table "public"."labang_sellers" to "anon";

grant select on table "public"."labang_sellers" to "anon";

grant trigger on table "public"."labang_sellers" to "anon";

grant truncate on table "public"."labang_sellers" to "anon";

grant update on table "public"."labang_sellers" to "anon";

grant delete on table "public"."labang_sellers" to "authenticated";

grant insert on table "public"."labang_sellers" to "authenticated";

grant references on table "public"."labang_sellers" to "authenticated";

grant select on table "public"."labang_sellers" to "authenticated";

grant trigger on table "public"."labang_sellers" to "authenticated";

grant truncate on table "public"."labang_sellers" to "authenticated";

grant update on table "public"."labang_sellers" to "authenticated";

grant delete on table "public"."labang_sellers" to "service_role";

grant insert on table "public"."labang_sellers" to "service_role";

grant references on table "public"."labang_sellers" to "service_role";

grant select on table "public"."labang_sellers" to "service_role";

grant trigger on table "public"."labang_sellers" to "service_role";

grant truncate on table "public"."labang_sellers" to "service_role";

grant update on table "public"."labang_sellers" to "service_role";

grant delete on table "public"."labang_stream_products" to "anon";

grant insert on table "public"."labang_stream_products" to "anon";

grant references on table "public"."labang_stream_products" to "anon";

grant select on table "public"."labang_stream_products" to "anon";

grant trigger on table "public"."labang_stream_products" to "anon";

grant truncate on table "public"."labang_stream_products" to "anon";

grant update on table "public"."labang_stream_products" to "anon";

grant delete on table "public"."labang_stream_products" to "authenticated";

grant insert on table "public"."labang_stream_products" to "authenticated";

grant references on table "public"."labang_stream_products" to "authenticated";

grant select on table "public"."labang_stream_products" to "authenticated";

grant trigger on table "public"."labang_stream_products" to "authenticated";

grant truncate on table "public"."labang_stream_products" to "authenticated";

grant update on table "public"."labang_stream_products" to "authenticated";

grant delete on table "public"."labang_stream_products" to "service_role";

grant insert on table "public"."labang_stream_products" to "service_role";

grant references on table "public"."labang_stream_products" to "service_role";

grant select on table "public"."labang_stream_products" to "service_role";

grant trigger on table "public"."labang_stream_products" to "service_role";

grant truncate on table "public"."labang_stream_products" to "service_role";

grant update on table "public"."labang_stream_products" to "service_role";

grant delete on table "public"."labang_streams" to "anon";

grant insert on table "public"."labang_streams" to "anon";

grant references on table "public"."labang_streams" to "anon";

grant select on table "public"."labang_streams" to "anon";

grant trigger on table "public"."labang_streams" to "anon";

grant truncate on table "public"."labang_streams" to "anon";

grant update on table "public"."labang_streams" to "anon";

grant delete on table "public"."labang_streams" to "authenticated";

grant insert on table "public"."labang_streams" to "authenticated";

grant references on table "public"."labang_streams" to "authenticated";

grant select on table "public"."labang_streams" to "authenticated";

grant trigger on table "public"."labang_streams" to "authenticated";

grant truncate on table "public"."labang_streams" to "authenticated";

grant update on table "public"."labang_streams" to "authenticated";

grant delete on table "public"."labang_streams" to "service_role";

grant insert on table "public"."labang_streams" to "service_role";

grant references on table "public"."labang_streams" to "service_role";

grant select on table "public"."labang_streams" to "service_role";

grant trigger on table "public"."labang_streams" to "service_role";

grant truncate on table "public"."labang_streams" to "service_role";

grant update on table "public"."labang_streams" to "service_role";

grant delete on table "public"."labang_watch_sessions" to "anon";

grant insert on table "public"."labang_watch_sessions" to "anon";

grant references on table "public"."labang_watch_sessions" to "anon";

grant select on table "public"."labang_watch_sessions" to "anon";

grant trigger on table "public"."labang_watch_sessions" to "anon";

grant truncate on table "public"."labang_watch_sessions" to "anon";

grant update on table "public"."labang_watch_sessions" to "anon";

grant delete on table "public"."labang_watch_sessions" to "authenticated";

grant insert on table "public"."labang_watch_sessions" to "authenticated";

grant references on table "public"."labang_watch_sessions" to "authenticated";

grant select on table "public"."labang_watch_sessions" to "authenticated";

grant trigger on table "public"."labang_watch_sessions" to "authenticated";

grant truncate on table "public"."labang_watch_sessions" to "authenticated";

grant update on table "public"."labang_watch_sessions" to "authenticated";

grant delete on table "public"."labang_watch_sessions" to "service_role";

grant insert on table "public"."labang_watch_sessions" to "service_role";

grant references on table "public"."labang_watch_sessions" to "service_role";

grant select on table "public"."labang_watch_sessions" to "service_role";

grant trigger on table "public"."labang_watch_sessions" to "service_role";

grant truncate on table "public"."labang_watch_sessions" to "service_role";

grant update on table "public"."labang_watch_sessions" to "service_role";

grant delete on table "public"."liquidity_history" to "anon";

grant insert on table "public"."liquidity_history" to "anon";

grant references on table "public"."liquidity_history" to "anon";

grant select on table "public"."liquidity_history" to "anon";

grant trigger on table "public"."liquidity_history" to "anon";

grant truncate on table "public"."liquidity_history" to "anon";

grant update on table "public"."liquidity_history" to "anon";

grant delete on table "public"."liquidity_history" to "authenticated";

grant insert on table "public"."liquidity_history" to "authenticated";

grant references on table "public"."liquidity_history" to "authenticated";

grant select on table "public"."liquidity_history" to "authenticated";

grant trigger on table "public"."liquidity_history" to "authenticated";

grant truncate on table "public"."liquidity_history" to "authenticated";

grant update on table "public"."liquidity_history" to "authenticated";

grant delete on table "public"."liquidity_history" to "service_role";

grant insert on table "public"."liquidity_history" to "service_role";

grant references on table "public"."liquidity_history" to "service_role";

grant select on table "public"."liquidity_history" to "service_role";

grant trigger on table "public"."liquidity_history" to "service_role";

grant truncate on table "public"."liquidity_history" to "service_role";

grant update on table "public"."liquidity_history" to "service_role";

grant delete on table "public"."meetings" to "anon";

grant insert on table "public"."meetings" to "anon";

grant references on table "public"."meetings" to "anon";

grant select on table "public"."meetings" to "anon";

grant trigger on table "public"."meetings" to "anon";

grant truncate on table "public"."meetings" to "anon";

grant update on table "public"."meetings" to "anon";

grant delete on table "public"."meetings" to "authenticated";

grant insert on table "public"."meetings" to "authenticated";

grant references on table "public"."meetings" to "authenticated";

grant select on table "public"."meetings" to "authenticated";

grant trigger on table "public"."meetings" to "authenticated";

grant truncate on table "public"."meetings" to "authenticated";

grant update on table "public"."meetings" to "authenticated";

grant delete on table "public"."meetings" to "service_role";

grant insert on table "public"."meetings" to "service_role";

grant references on table "public"."meetings" to "service_role";

grant select on table "public"."meetings" to "service_role";

grant trigger on table "public"."meetings" to "service_role";

grant truncate on table "public"."meetings" to "service_role";

grant update on table "public"."meetings" to "service_role";

grant delete on table "public"."memories" to "anon";

grant insert on table "public"."memories" to "anon";

grant references on table "public"."memories" to "anon";

grant select on table "public"."memories" to "anon";

grant trigger on table "public"."memories" to "anon";

grant truncate on table "public"."memories" to "anon";

grant update on table "public"."memories" to "anon";

grant delete on table "public"."memories" to "authenticated";

grant insert on table "public"."memories" to "authenticated";

grant references on table "public"."memories" to "authenticated";

grant select on table "public"."memories" to "authenticated";

grant trigger on table "public"."memories" to "authenticated";

grant truncate on table "public"."memories" to "authenticated";

grant update on table "public"."memories" to "authenticated";

grant delete on table "public"."memories" to "service_role";

grant insert on table "public"."memories" to "service_role";

grant references on table "public"."memories" to "service_role";

grant select on table "public"."memories" to "service_role";

grant trigger on table "public"."memories" to "service_role";

grant truncate on table "public"."memories" to "service_role";

grant update on table "public"."memories" to "service_role";

grant delete on table "public"."milestones" to "anon";

grant insert on table "public"."milestones" to "anon";

grant references on table "public"."milestones" to "anon";

grant select on table "public"."milestones" to "anon";

grant trigger on table "public"."milestones" to "anon";

grant truncate on table "public"."milestones" to "anon";

grant update on table "public"."milestones" to "anon";

grant delete on table "public"."milestones" to "authenticated";

grant insert on table "public"."milestones" to "authenticated";

grant references on table "public"."milestones" to "authenticated";

grant select on table "public"."milestones" to "authenticated";

grant trigger on table "public"."milestones" to "authenticated";

grant truncate on table "public"."milestones" to "authenticated";

grant update on table "public"."milestones" to "authenticated";

grant delete on table "public"."milestones" to "service_role";

grant insert on table "public"."milestones" to "service_role";

grant references on table "public"."milestones" to "service_role";

grant select on table "public"."milestones" to "service_role";

grant trigger on table "public"."milestones" to "service_role";

grant truncate on table "public"."milestones" to "service_role";

grant update on table "public"."milestones" to "service_role";

grant delete on table "public"."mocat_ai_ai_agents" to "anon";

grant insert on table "public"."mocat_ai_ai_agents" to "anon";

grant references on table "public"."mocat_ai_ai_agents" to "anon";

grant select on table "public"."mocat_ai_ai_agents" to "anon";

grant trigger on table "public"."mocat_ai_ai_agents" to "anon";

grant truncate on table "public"."mocat_ai_ai_agents" to "anon";

grant update on table "public"."mocat_ai_ai_agents" to "anon";

grant delete on table "public"."mocat_ai_ai_agents" to "authenticated";

grant insert on table "public"."mocat_ai_ai_agents" to "authenticated";

grant references on table "public"."mocat_ai_ai_agents" to "authenticated";

grant select on table "public"."mocat_ai_ai_agents" to "authenticated";

grant trigger on table "public"."mocat_ai_ai_agents" to "authenticated";

grant truncate on table "public"."mocat_ai_ai_agents" to "authenticated";

grant update on table "public"."mocat_ai_ai_agents" to "authenticated";

grant delete on table "public"."mocat_ai_ai_agents" to "service_role";

grant insert on table "public"."mocat_ai_ai_agents" to "service_role";

grant references on table "public"."mocat_ai_ai_agents" to "service_role";

grant select on table "public"."mocat_ai_ai_agents" to "service_role";

grant trigger on table "public"."mocat_ai_ai_agents" to "service_role";

grant truncate on table "public"."mocat_ai_ai_agents" to "service_role";

grant update on table "public"."mocat_ai_ai_agents" to "service_role";

grant delete on table "public"."mocat_ai_clusters" to "anon";

grant insert on table "public"."mocat_ai_clusters" to "anon";

grant references on table "public"."mocat_ai_clusters" to "anon";

grant select on table "public"."mocat_ai_clusters" to "anon";

grant trigger on table "public"."mocat_ai_clusters" to "anon";

grant truncate on table "public"."mocat_ai_clusters" to "anon";

grant update on table "public"."mocat_ai_clusters" to "anon";

grant delete on table "public"."mocat_ai_clusters" to "authenticated";

grant insert on table "public"."mocat_ai_clusters" to "authenticated";

grant references on table "public"."mocat_ai_clusters" to "authenticated";

grant select on table "public"."mocat_ai_clusters" to "authenticated";

grant trigger on table "public"."mocat_ai_clusters" to "authenticated";

grant truncate on table "public"."mocat_ai_clusters" to "authenticated";

grant update on table "public"."mocat_ai_clusters" to "authenticated";

grant delete on table "public"."mocat_ai_clusters" to "service_role";

grant insert on table "public"."mocat_ai_clusters" to "service_role";

grant references on table "public"."mocat_ai_clusters" to "service_role";

grant select on table "public"."mocat_ai_clusters" to "service_role";

grant trigger on table "public"."mocat_ai_clusters" to "service_role";

grant truncate on table "public"."mocat_ai_clusters" to "service_role";

grant update on table "public"."mocat_ai_clusters" to "service_role";

grant delete on table "public"."mocat_ai_consensus_records" to "anon";

grant insert on table "public"."mocat_ai_consensus_records" to "anon";

grant references on table "public"."mocat_ai_consensus_records" to "anon";

grant select on table "public"."mocat_ai_consensus_records" to "anon";

grant trigger on table "public"."mocat_ai_consensus_records" to "anon";

grant truncate on table "public"."mocat_ai_consensus_records" to "anon";

grant update on table "public"."mocat_ai_consensus_records" to "anon";

grant delete on table "public"."mocat_ai_consensus_records" to "authenticated";

grant insert on table "public"."mocat_ai_consensus_records" to "authenticated";

grant references on table "public"."mocat_ai_consensus_records" to "authenticated";

grant select on table "public"."mocat_ai_consensus_records" to "authenticated";

grant trigger on table "public"."mocat_ai_consensus_records" to "authenticated";

grant truncate on table "public"."mocat_ai_consensus_records" to "authenticated";

grant update on table "public"."mocat_ai_consensus_records" to "authenticated";

grant delete on table "public"."mocat_ai_consensus_records" to "service_role";

grant insert on table "public"."mocat_ai_consensus_records" to "service_role";

grant references on table "public"."mocat_ai_consensus_records" to "service_role";

grant select on table "public"."mocat_ai_consensus_records" to "service_role";

grant trigger on table "public"."mocat_ai_consensus_records" to "service_role";

grant truncate on table "public"."mocat_ai_consensus_records" to "service_role";

grant update on table "public"."mocat_ai_consensus_records" to "service_role";

grant delete on table "public"."mocat_ai_copy_trading" to "anon";

grant insert on table "public"."mocat_ai_copy_trading" to "anon";

grant references on table "public"."mocat_ai_copy_trading" to "anon";

grant select on table "public"."mocat_ai_copy_trading" to "anon";

grant trigger on table "public"."mocat_ai_copy_trading" to "anon";

grant truncate on table "public"."mocat_ai_copy_trading" to "anon";

grant update on table "public"."mocat_ai_copy_trading" to "anon";

grant delete on table "public"."mocat_ai_copy_trading" to "authenticated";

grant insert on table "public"."mocat_ai_copy_trading" to "authenticated";

grant references on table "public"."mocat_ai_copy_trading" to "authenticated";

grant select on table "public"."mocat_ai_copy_trading" to "authenticated";

grant trigger on table "public"."mocat_ai_copy_trading" to "authenticated";

grant truncate on table "public"."mocat_ai_copy_trading" to "authenticated";

grant update on table "public"."mocat_ai_copy_trading" to "authenticated";

grant delete on table "public"."mocat_ai_copy_trading" to "service_role";

grant insert on table "public"."mocat_ai_copy_trading" to "service_role";

grant references on table "public"."mocat_ai_copy_trading" to "service_role";

grant select on table "public"."mocat_ai_copy_trading" to "service_role";

grant trigger on table "public"."mocat_ai_copy_trading" to "service_role";

grant truncate on table "public"."mocat_ai_copy_trading" to "service_role";

grant update on table "public"."mocat_ai_copy_trading" to "service_role";

grant delete on table "public"."mocat_ai_expert_traders" to "anon";

grant insert on table "public"."mocat_ai_expert_traders" to "anon";

grant references on table "public"."mocat_ai_expert_traders" to "anon";

grant select on table "public"."mocat_ai_expert_traders" to "anon";

grant trigger on table "public"."mocat_ai_expert_traders" to "anon";

grant truncate on table "public"."mocat_ai_expert_traders" to "anon";

grant update on table "public"."mocat_ai_expert_traders" to "anon";

grant delete on table "public"."mocat_ai_expert_traders" to "authenticated";

grant insert on table "public"."mocat_ai_expert_traders" to "authenticated";

grant references on table "public"."mocat_ai_expert_traders" to "authenticated";

grant select on table "public"."mocat_ai_expert_traders" to "authenticated";

grant trigger on table "public"."mocat_ai_expert_traders" to "authenticated";

grant truncate on table "public"."mocat_ai_expert_traders" to "authenticated";

grant update on table "public"."mocat_ai_expert_traders" to "authenticated";

grant delete on table "public"."mocat_ai_expert_traders" to "service_role";

grant insert on table "public"."mocat_ai_expert_traders" to "service_role";

grant references on table "public"."mocat_ai_expert_traders" to "service_role";

grant select on table "public"."mocat_ai_expert_traders" to "service_role";

grant trigger on table "public"."mocat_ai_expert_traders" to "service_role";

grant truncate on table "public"."mocat_ai_expert_traders" to "service_role";

grant update on table "public"."mocat_ai_expert_traders" to "service_role";

grant delete on table "public"."mocat_ai_follows" to "anon";

grant insert on table "public"."mocat_ai_follows" to "anon";

grant references on table "public"."mocat_ai_follows" to "anon";

grant select on table "public"."mocat_ai_follows" to "anon";

grant trigger on table "public"."mocat_ai_follows" to "anon";

grant truncate on table "public"."mocat_ai_follows" to "anon";

grant update on table "public"."mocat_ai_follows" to "anon";

grant delete on table "public"."mocat_ai_follows" to "authenticated";

grant insert on table "public"."mocat_ai_follows" to "authenticated";

grant references on table "public"."mocat_ai_follows" to "authenticated";

grant select on table "public"."mocat_ai_follows" to "authenticated";

grant trigger on table "public"."mocat_ai_follows" to "authenticated";

grant truncate on table "public"."mocat_ai_follows" to "authenticated";

grant update on table "public"."mocat_ai_follows" to "authenticated";

grant delete on table "public"."mocat_ai_follows" to "service_role";

grant insert on table "public"."mocat_ai_follows" to "service_role";

grant references on table "public"."mocat_ai_follows" to "service_role";

grant select on table "public"."mocat_ai_follows" to "service_role";

grant trigger on table "public"."mocat_ai_follows" to "service_role";

grant truncate on table "public"."mocat_ai_follows" to "service_role";

grant update on table "public"."mocat_ai_follows" to "service_role";

grant delete on table "public"."mocat_ai_moca_credentials" to "anon";

grant insert on table "public"."mocat_ai_moca_credentials" to "anon";

grant references on table "public"."mocat_ai_moca_credentials" to "anon";

grant select on table "public"."mocat_ai_moca_credentials" to "anon";

grant trigger on table "public"."mocat_ai_moca_credentials" to "anon";

grant truncate on table "public"."mocat_ai_moca_credentials" to "anon";

grant update on table "public"."mocat_ai_moca_credentials" to "anon";

grant delete on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant insert on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant references on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant select on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant trigger on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant truncate on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant update on table "public"."mocat_ai_moca_credentials" to "authenticated";

grant delete on table "public"."mocat_ai_moca_credentials" to "service_role";

grant insert on table "public"."mocat_ai_moca_credentials" to "service_role";

grant references on table "public"."mocat_ai_moca_credentials" to "service_role";

grant select on table "public"."mocat_ai_moca_credentials" to "service_role";

grant trigger on table "public"."mocat_ai_moca_credentials" to "service_role";

grant truncate on table "public"."mocat_ai_moca_credentials" to "service_role";

grant update on table "public"."mocat_ai_moca_credentials" to "service_role";

grant delete on table "public"."mocat_ai_signal_validations" to "anon";

grant insert on table "public"."mocat_ai_signal_validations" to "anon";

grant references on table "public"."mocat_ai_signal_validations" to "anon";

grant select on table "public"."mocat_ai_signal_validations" to "anon";

grant trigger on table "public"."mocat_ai_signal_validations" to "anon";

grant truncate on table "public"."mocat_ai_signal_validations" to "anon";

grant update on table "public"."mocat_ai_signal_validations" to "anon";

grant delete on table "public"."mocat_ai_signal_validations" to "authenticated";

grant insert on table "public"."mocat_ai_signal_validations" to "authenticated";

grant references on table "public"."mocat_ai_signal_validations" to "authenticated";

grant select on table "public"."mocat_ai_signal_validations" to "authenticated";

grant trigger on table "public"."mocat_ai_signal_validations" to "authenticated";

grant truncate on table "public"."mocat_ai_signal_validations" to "authenticated";

grant update on table "public"."mocat_ai_signal_validations" to "authenticated";

grant delete on table "public"."mocat_ai_signal_validations" to "service_role";

grant insert on table "public"."mocat_ai_signal_validations" to "service_role";

grant references on table "public"."mocat_ai_signal_validations" to "service_role";

grant select on table "public"."mocat_ai_signal_validations" to "service_role";

grant trigger on table "public"."mocat_ai_signal_validations" to "service_role";

grant truncate on table "public"."mocat_ai_signal_validations" to "service_role";

grant update on table "public"."mocat_ai_signal_validations" to "service_role";

grant delete on table "public"."mocat_ai_trading_signals" to "anon";

grant insert on table "public"."mocat_ai_trading_signals" to "anon";

grant references on table "public"."mocat_ai_trading_signals" to "anon";

grant select on table "public"."mocat_ai_trading_signals" to "anon";

grant trigger on table "public"."mocat_ai_trading_signals" to "anon";

grant truncate on table "public"."mocat_ai_trading_signals" to "anon";

grant update on table "public"."mocat_ai_trading_signals" to "anon";

grant delete on table "public"."mocat_ai_trading_signals" to "authenticated";

grant insert on table "public"."mocat_ai_trading_signals" to "authenticated";

grant references on table "public"."mocat_ai_trading_signals" to "authenticated";

grant select on table "public"."mocat_ai_trading_signals" to "authenticated";

grant trigger on table "public"."mocat_ai_trading_signals" to "authenticated";

grant truncate on table "public"."mocat_ai_trading_signals" to "authenticated";

grant update on table "public"."mocat_ai_trading_signals" to "authenticated";

grant delete on table "public"."mocat_ai_trading_signals" to "service_role";

grant insert on table "public"."mocat_ai_trading_signals" to "service_role";

grant references on table "public"."mocat_ai_trading_signals" to "service_role";

grant select on table "public"."mocat_ai_trading_signals" to "service_role";

grant trigger on table "public"."mocat_ai_trading_signals" to "service_role";

grant truncate on table "public"."mocat_ai_trading_signals" to "service_role";

grant update on table "public"."mocat_ai_trading_signals" to "service_role";

grant delete on table "public"."mocat_ai_users" to "anon";

grant insert on table "public"."mocat_ai_users" to "anon";

grant references on table "public"."mocat_ai_users" to "anon";

grant select on table "public"."mocat_ai_users" to "anon";

grant trigger on table "public"."mocat_ai_users" to "anon";

grant truncate on table "public"."mocat_ai_users" to "anon";

grant update on table "public"."mocat_ai_users" to "anon";

grant delete on table "public"."mocat_ai_users" to "authenticated";

grant insert on table "public"."mocat_ai_users" to "authenticated";

grant references on table "public"."mocat_ai_users" to "authenticated";

grant select on table "public"."mocat_ai_users" to "authenticated";

grant trigger on table "public"."mocat_ai_users" to "authenticated";

grant truncate on table "public"."mocat_ai_users" to "authenticated";

grant update on table "public"."mocat_ai_users" to "authenticated";

grant delete on table "public"."mocat_ai_users" to "service_role";

grant insert on table "public"."mocat_ai_users" to "service_role";

grant references on table "public"."mocat_ai_users" to "service_role";

grant select on table "public"."mocat_ai_users" to "service_role";

grant trigger on table "public"."mocat_ai_users" to "service_role";

grant truncate on table "public"."mocat_ai_users" to "service_role";

grant update on table "public"."mocat_ai_users" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."playwright_allocations" to "anon";

grant insert on table "public"."playwright_allocations" to "anon";

grant references on table "public"."playwright_allocations" to "anon";

grant select on table "public"."playwright_allocations" to "anon";

grant trigger on table "public"."playwright_allocations" to "anon";

grant truncate on table "public"."playwright_allocations" to "anon";

grant update on table "public"."playwright_allocations" to "anon";

grant delete on table "public"."playwright_allocations" to "authenticated";

grant insert on table "public"."playwright_allocations" to "authenticated";

grant references on table "public"."playwright_allocations" to "authenticated";

grant select on table "public"."playwright_allocations" to "authenticated";

grant trigger on table "public"."playwright_allocations" to "authenticated";

grant truncate on table "public"."playwright_allocations" to "authenticated";

grant update on table "public"."playwright_allocations" to "authenticated";

grant delete on table "public"."playwright_allocations" to "service_role";

grant insert on table "public"."playwright_allocations" to "service_role";

grant references on table "public"."playwright_allocations" to "service_role";

grant select on table "public"."playwright_allocations" to "service_role";

grant trigger on table "public"."playwright_allocations" to "service_role";

grant truncate on table "public"."playwright_allocations" to "service_role";

grant update on table "public"."playwright_allocations" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."project_b2b_clients" to "anon";

grant insert on table "public"."project_b2b_clients" to "anon";

grant references on table "public"."project_b2b_clients" to "anon";

grant select on table "public"."project_b2b_clients" to "anon";

grant trigger on table "public"."project_b2b_clients" to "anon";

grant truncate on table "public"."project_b2b_clients" to "anon";

grant update on table "public"."project_b2b_clients" to "anon";

grant delete on table "public"."project_b2b_clients" to "authenticated";

grant insert on table "public"."project_b2b_clients" to "authenticated";

grant references on table "public"."project_b2b_clients" to "authenticated";

grant select on table "public"."project_b2b_clients" to "authenticated";

grant trigger on table "public"."project_b2b_clients" to "authenticated";

grant truncate on table "public"."project_b2b_clients" to "authenticated";

grant update on table "public"."project_b2b_clients" to "authenticated";

grant delete on table "public"."project_b2b_clients" to "service_role";

grant insert on table "public"."project_b2b_clients" to "service_role";

grant references on table "public"."project_b2b_clients" to "service_role";

grant select on table "public"."project_b2b_clients" to "service_role";

grant trigger on table "public"."project_b2b_clients" to "service_role";

grant truncate on table "public"."project_b2b_clients" to "service_role";

grant update on table "public"."project_b2b_clients" to "service_role";

grant delete on table "public"."project_network_activity" to "anon";

grant insert on table "public"."project_network_activity" to "anon";

grant references on table "public"."project_network_activity" to "anon";

grant select on table "public"."project_network_activity" to "anon";

grant trigger on table "public"."project_network_activity" to "anon";

grant truncate on table "public"."project_network_activity" to "anon";

grant update on table "public"."project_network_activity" to "anon";

grant delete on table "public"."project_network_activity" to "authenticated";

grant insert on table "public"."project_network_activity" to "authenticated";

grant references on table "public"."project_network_activity" to "authenticated";

grant select on table "public"."project_network_activity" to "authenticated";

grant trigger on table "public"."project_network_activity" to "authenticated";

grant truncate on table "public"."project_network_activity" to "authenticated";

grant update on table "public"."project_network_activity" to "authenticated";

grant delete on table "public"."project_network_activity" to "service_role";

grant insert on table "public"."project_network_activity" to "service_role";

grant references on table "public"."project_network_activity" to "service_role";

grant select on table "public"."project_network_activity" to "service_role";

grant trigger on table "public"."project_network_activity" to "service_role";

grant truncate on table "public"."project_network_activity" to "service_role";

grant update on table "public"."project_network_activity" to "service_role";

grant delete on table "public"."project_onchain_metrics" to "anon";

grant insert on table "public"."project_onchain_metrics" to "anon";

grant references on table "public"."project_onchain_metrics" to "anon";

grant select on table "public"."project_onchain_metrics" to "anon";

grant trigger on table "public"."project_onchain_metrics" to "anon";

grant truncate on table "public"."project_onchain_metrics" to "anon";

grant update on table "public"."project_onchain_metrics" to "anon";

grant delete on table "public"."project_onchain_metrics" to "authenticated";

grant insert on table "public"."project_onchain_metrics" to "authenticated";

grant references on table "public"."project_onchain_metrics" to "authenticated";

grant select on table "public"."project_onchain_metrics" to "authenticated";

grant trigger on table "public"."project_onchain_metrics" to "authenticated";

grant truncate on table "public"."project_onchain_metrics" to "authenticated";

grant update on table "public"."project_onchain_metrics" to "authenticated";

grant delete on table "public"."project_onchain_metrics" to "service_role";

grant insert on table "public"."project_onchain_metrics" to "service_role";

grant references on table "public"."project_onchain_metrics" to "service_role";

grant select on table "public"."project_onchain_metrics" to "service_role";

grant trigger on table "public"."project_onchain_metrics" to "service_role";

grant truncate on table "public"."project_onchain_metrics" to "service_role";

grant update on table "public"."project_onchain_metrics" to "service_role";

grant delete on table "public"."project_onchain_transactions" to "anon";

grant insert on table "public"."project_onchain_transactions" to "anon";

grant references on table "public"."project_onchain_transactions" to "anon";

grant select on table "public"."project_onchain_transactions" to "anon";

grant trigger on table "public"."project_onchain_transactions" to "anon";

grant truncate on table "public"."project_onchain_transactions" to "anon";

grant update on table "public"."project_onchain_transactions" to "anon";

grant delete on table "public"."project_onchain_transactions" to "authenticated";

grant insert on table "public"."project_onchain_transactions" to "authenticated";

grant references on table "public"."project_onchain_transactions" to "authenticated";

grant select on table "public"."project_onchain_transactions" to "authenticated";

grant trigger on table "public"."project_onchain_transactions" to "authenticated";

grant truncate on table "public"."project_onchain_transactions" to "authenticated";

grant update on table "public"."project_onchain_transactions" to "authenticated";

grant delete on table "public"."project_onchain_transactions" to "service_role";

grant insert on table "public"."project_onchain_transactions" to "service_role";

grant references on table "public"."project_onchain_transactions" to "service_role";

grant select on table "public"."project_onchain_transactions" to "service_role";

grant trigger on table "public"."project_onchain_transactions" to "service_role";

grant truncate on table "public"."project_onchain_transactions" to "service_role";

grant update on table "public"."project_onchain_transactions" to "service_role";

grant delete on table "public"."project_social_activities" to "anon";

grant insert on table "public"."project_social_activities" to "anon";

grant references on table "public"."project_social_activities" to "anon";

grant select on table "public"."project_social_activities" to "anon";

grant trigger on table "public"."project_social_activities" to "anon";

grant truncate on table "public"."project_social_activities" to "anon";

grant update on table "public"."project_social_activities" to "anon";

grant delete on table "public"."project_social_activities" to "authenticated";

grant insert on table "public"."project_social_activities" to "authenticated";

grant references on table "public"."project_social_activities" to "authenticated";

grant select on table "public"."project_social_activities" to "authenticated";

grant trigger on table "public"."project_social_activities" to "authenticated";

grant truncate on table "public"."project_social_activities" to "authenticated";

grant update on table "public"."project_social_activities" to "authenticated";

grant delete on table "public"."project_social_activities" to "service_role";

grant insert on table "public"."project_social_activities" to "service_role";

grant references on table "public"."project_social_activities" to "service_role";

grant select on table "public"."project_social_activities" to "service_role";

grant trigger on table "public"."project_social_activities" to "service_role";

grant truncate on table "public"."project_social_activities" to "service_role";

grant update on table "public"."project_social_activities" to "service_role";

grant delete on table "public"."project_social_metrics" to "anon";

grant insert on table "public"."project_social_metrics" to "anon";

grant references on table "public"."project_social_metrics" to "anon";

grant select on table "public"."project_social_metrics" to "anon";

grant trigger on table "public"."project_social_metrics" to "anon";

grant truncate on table "public"."project_social_metrics" to "anon";

grant update on table "public"."project_social_metrics" to "anon";

grant delete on table "public"."project_social_metrics" to "authenticated";

grant insert on table "public"."project_social_metrics" to "authenticated";

grant references on table "public"."project_social_metrics" to "authenticated";

grant select on table "public"."project_social_metrics" to "authenticated";

grant trigger on table "public"."project_social_metrics" to "authenticated";

grant truncate on table "public"."project_social_metrics" to "authenticated";

grant update on table "public"."project_social_metrics" to "authenticated";

grant delete on table "public"."project_social_metrics" to "service_role";

grant insert on table "public"."project_social_metrics" to "service_role";

grant references on table "public"."project_social_metrics" to "service_role";

grant select on table "public"."project_social_metrics" to "service_role";

grant trigger on table "public"."project_social_metrics" to "service_role";

grant truncate on table "public"."project_social_metrics" to "service_role";

grant update on table "public"."project_social_metrics" to "service_role";

grant delete on table "public"."project_wallets" to "anon";

grant insert on table "public"."project_wallets" to "anon";

grant references on table "public"."project_wallets" to "anon";

grant select on table "public"."project_wallets" to "anon";

grant trigger on table "public"."project_wallets" to "anon";

grant truncate on table "public"."project_wallets" to "anon";

grant update on table "public"."project_wallets" to "anon";

grant delete on table "public"."project_wallets" to "authenticated";

grant insert on table "public"."project_wallets" to "authenticated";

grant references on table "public"."project_wallets" to "authenticated";

grant select on table "public"."project_wallets" to "authenticated";

grant trigger on table "public"."project_wallets" to "authenticated";

grant truncate on table "public"."project_wallets" to "authenticated";

grant update on table "public"."project_wallets" to "authenticated";

grant delete on table "public"."project_wallets" to "service_role";

grant insert on table "public"."project_wallets" to "service_role";

grant references on table "public"."project_wallets" to "service_role";

grant select on table "public"."project_wallets" to "service_role";

grant trigger on table "public"."project_wallets" to "service_role";

grant truncate on table "public"."project_wallets" to "service_role";

grant update on table "public"."project_wallets" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."salvation_businesses" to "anon";

grant insert on table "public"."salvation_businesses" to "anon";

grant references on table "public"."salvation_businesses" to "anon";

grant select on table "public"."salvation_businesses" to "anon";

grant trigger on table "public"."salvation_businesses" to "anon";

grant truncate on table "public"."salvation_businesses" to "anon";

grant update on table "public"."salvation_businesses" to "anon";

grant delete on table "public"."salvation_businesses" to "authenticated";

grant insert on table "public"."salvation_businesses" to "authenticated";

grant references on table "public"."salvation_businesses" to "authenticated";

grant select on table "public"."salvation_businesses" to "authenticated";

grant trigger on table "public"."salvation_businesses" to "authenticated";

grant truncate on table "public"."salvation_businesses" to "authenticated";

grant update on table "public"."salvation_businesses" to "authenticated";

grant delete on table "public"."salvation_businesses" to "service_role";

grant insert on table "public"."salvation_businesses" to "service_role";

grant references on table "public"."salvation_businesses" to "service_role";

grant select on table "public"."salvation_businesses" to "service_role";

grant trigger on table "public"."salvation_businesses" to "service_role";

grant truncate on table "public"."salvation_businesses" to "service_role";

grant update on table "public"."salvation_businesses" to "service_role";

grant delete on table "public"."salvation_conversations" to "anon";

grant insert on table "public"."salvation_conversations" to "anon";

grant references on table "public"."salvation_conversations" to "anon";

grant select on table "public"."salvation_conversations" to "anon";

grant trigger on table "public"."salvation_conversations" to "anon";

grant truncate on table "public"."salvation_conversations" to "anon";

grant update on table "public"."salvation_conversations" to "anon";

grant delete on table "public"."salvation_conversations" to "authenticated";

grant insert on table "public"."salvation_conversations" to "authenticated";

grant references on table "public"."salvation_conversations" to "authenticated";

grant select on table "public"."salvation_conversations" to "authenticated";

grant trigger on table "public"."salvation_conversations" to "authenticated";

grant truncate on table "public"."salvation_conversations" to "authenticated";

grant update on table "public"."salvation_conversations" to "authenticated";

grant delete on table "public"."salvation_conversations" to "service_role";

grant insert on table "public"."salvation_conversations" to "service_role";

grant references on table "public"."salvation_conversations" to "service_role";

grant select on table "public"."salvation_conversations" to "service_role";

grant trigger on table "public"."salvation_conversations" to "service_role";

grant truncate on table "public"."salvation_conversations" to "service_role";

grant update on table "public"."salvation_conversations" to "service_role";

grant delete on table "public"."salvation_ipfs_metadata" to "anon";

grant insert on table "public"."salvation_ipfs_metadata" to "anon";

grant references on table "public"."salvation_ipfs_metadata" to "anon";

grant select on table "public"."salvation_ipfs_metadata" to "anon";

grant trigger on table "public"."salvation_ipfs_metadata" to "anon";

grant truncate on table "public"."salvation_ipfs_metadata" to "anon";

grant update on table "public"."salvation_ipfs_metadata" to "anon";

grant delete on table "public"."salvation_ipfs_metadata" to "authenticated";

grant insert on table "public"."salvation_ipfs_metadata" to "authenticated";

grant references on table "public"."salvation_ipfs_metadata" to "authenticated";

grant select on table "public"."salvation_ipfs_metadata" to "authenticated";

grant trigger on table "public"."salvation_ipfs_metadata" to "authenticated";

grant truncate on table "public"."salvation_ipfs_metadata" to "authenticated";

grant update on table "public"."salvation_ipfs_metadata" to "authenticated";

grant delete on table "public"."salvation_ipfs_metadata" to "service_role";

grant insert on table "public"."salvation_ipfs_metadata" to "service_role";

grant references on table "public"."salvation_ipfs_metadata" to "service_role";

grant select on table "public"."salvation_ipfs_metadata" to "service_role";

grant trigger on table "public"."salvation_ipfs_metadata" to "service_role";

grant truncate on table "public"."salvation_ipfs_metadata" to "service_role";

grant update on table "public"."salvation_ipfs_metadata" to "service_role";

grant delete on table "public"."salvation_project_applications" to "anon";

grant insert on table "public"."salvation_project_applications" to "anon";

grant references on table "public"."salvation_project_applications" to "anon";

grant select on table "public"."salvation_project_applications" to "anon";

grant trigger on table "public"."salvation_project_applications" to "anon";

grant truncate on table "public"."salvation_project_applications" to "anon";

grant update on table "public"."salvation_project_applications" to "anon";

grant delete on table "public"."salvation_project_applications" to "authenticated";

grant insert on table "public"."salvation_project_applications" to "authenticated";

grant references on table "public"."salvation_project_applications" to "authenticated";

grant select on table "public"."salvation_project_applications" to "authenticated";

grant trigger on table "public"."salvation_project_applications" to "authenticated";

grant truncate on table "public"."salvation_project_applications" to "authenticated";

grant update on table "public"."salvation_project_applications" to "authenticated";

grant delete on table "public"."salvation_project_applications" to "service_role";

grant insert on table "public"."salvation_project_applications" to "service_role";

grant references on table "public"."salvation_project_applications" to "service_role";

grant select on table "public"."salvation_project_applications" to "service_role";

grant trigger on table "public"."salvation_project_applications" to "service_role";

grant truncate on table "public"."salvation_project_applications" to "service_role";

grant update on table "public"."salvation_project_applications" to "service_role";

grant delete on table "public"."sentinel_api_keys" to "anon";

grant insert on table "public"."sentinel_api_keys" to "anon";

grant references on table "public"."sentinel_api_keys" to "anon";

grant select on table "public"."sentinel_api_keys" to "anon";

grant trigger on table "public"."sentinel_api_keys" to "anon";

grant truncate on table "public"."sentinel_api_keys" to "anon";

grant update on table "public"."sentinel_api_keys" to "anon";

grant delete on table "public"."sentinel_api_keys" to "authenticated";

grant insert on table "public"."sentinel_api_keys" to "authenticated";

grant references on table "public"."sentinel_api_keys" to "authenticated";

grant select on table "public"."sentinel_api_keys" to "authenticated";

grant trigger on table "public"."sentinel_api_keys" to "authenticated";

grant truncate on table "public"."sentinel_api_keys" to "authenticated";

grant update on table "public"."sentinel_api_keys" to "authenticated";

grant delete on table "public"."sentinel_api_keys" to "service_role";

grant insert on table "public"."sentinel_api_keys" to "service_role";

grant references on table "public"."sentinel_api_keys" to "service_role";

grant select on table "public"."sentinel_api_keys" to "service_role";

grant trigger on table "public"."sentinel_api_keys" to "service_role";

grant truncate on table "public"."sentinel_api_keys" to "service_role";

grant update on table "public"."sentinel_api_keys" to "service_role";

grant delete on table "public"."sentinel_debugger_runs" to "anon";

grant insert on table "public"."sentinel_debugger_runs" to "anon";

grant references on table "public"."sentinel_debugger_runs" to "anon";

grant select on table "public"."sentinel_debugger_runs" to "anon";

grant trigger on table "public"."sentinel_debugger_runs" to "anon";

grant truncate on table "public"."sentinel_debugger_runs" to "anon";

grant update on table "public"."sentinel_debugger_runs" to "anon";

grant delete on table "public"."sentinel_debugger_runs" to "authenticated";

grant insert on table "public"."sentinel_debugger_runs" to "authenticated";

grant references on table "public"."sentinel_debugger_runs" to "authenticated";

grant select on table "public"."sentinel_debugger_runs" to "authenticated";

grant trigger on table "public"."sentinel_debugger_runs" to "authenticated";

grant truncate on table "public"."sentinel_debugger_runs" to "authenticated";

grant update on table "public"."sentinel_debugger_runs" to "authenticated";

grant delete on table "public"."sentinel_debugger_runs" to "service_role";

grant insert on table "public"."sentinel_debugger_runs" to "service_role";

grant references on table "public"."sentinel_debugger_runs" to "service_role";

grant select on table "public"."sentinel_debugger_runs" to "service_role";

grant trigger on table "public"."sentinel_debugger_runs" to "service_role";

grant truncate on table "public"."sentinel_debugger_runs" to "service_role";

grant update on table "public"."sentinel_debugger_runs" to "service_role";

grant delete on table "public"."sentinel_gas_analyses" to "anon";

grant insert on table "public"."sentinel_gas_analyses" to "anon";

grant references on table "public"."sentinel_gas_analyses" to "anon";

grant select on table "public"."sentinel_gas_analyses" to "anon";

grant trigger on table "public"."sentinel_gas_analyses" to "anon";

grant truncate on table "public"."sentinel_gas_analyses" to "anon";

grant update on table "public"."sentinel_gas_analyses" to "anon";

grant delete on table "public"."sentinel_gas_analyses" to "authenticated";

grant insert on table "public"."sentinel_gas_analyses" to "authenticated";

grant references on table "public"."sentinel_gas_analyses" to "authenticated";

grant select on table "public"."sentinel_gas_analyses" to "authenticated";

grant trigger on table "public"."sentinel_gas_analyses" to "authenticated";

grant truncate on table "public"."sentinel_gas_analyses" to "authenticated";

grant update on table "public"."sentinel_gas_analyses" to "authenticated";

grant delete on table "public"."sentinel_gas_analyses" to "service_role";

grant insert on table "public"."sentinel_gas_analyses" to "service_role";

grant references on table "public"."sentinel_gas_analyses" to "service_role";

grant select on table "public"."sentinel_gas_analyses" to "service_role";

grant trigger on table "public"."sentinel_gas_analyses" to "service_role";

grant truncate on table "public"."sentinel_gas_analyses" to "service_role";

grant update on table "public"."sentinel_gas_analyses" to "service_role";

grant delete on table "public"."sentinel_projects" to "anon";

grant insert on table "public"."sentinel_projects" to "anon";

grant references on table "public"."sentinel_projects" to "anon";

grant select on table "public"."sentinel_projects" to "anon";

grant trigger on table "public"."sentinel_projects" to "anon";

grant truncate on table "public"."sentinel_projects" to "anon";

grant update on table "public"."sentinel_projects" to "anon";

grant delete on table "public"."sentinel_projects" to "authenticated";

grant insert on table "public"."sentinel_projects" to "authenticated";

grant references on table "public"."sentinel_projects" to "authenticated";

grant select on table "public"."sentinel_projects" to "authenticated";

grant trigger on table "public"."sentinel_projects" to "authenticated";

grant truncate on table "public"."sentinel_projects" to "authenticated";

grant update on table "public"."sentinel_projects" to "authenticated";

grant delete on table "public"."sentinel_projects" to "service_role";

grant insert on table "public"."sentinel_projects" to "service_role";

grant references on table "public"."sentinel_projects" to "service_role";

grant select on table "public"."sentinel_projects" to "service_role";

grant trigger on table "public"."sentinel_projects" to "service_role";

grant truncate on table "public"."sentinel_projects" to "service_role";

grant update on table "public"."sentinel_projects" to "service_role";

grant delete on table "public"."sentinel_prover_runs" to "anon";

grant insert on table "public"."sentinel_prover_runs" to "anon";

grant references on table "public"."sentinel_prover_runs" to "anon";

grant select on table "public"."sentinel_prover_runs" to "anon";

grant trigger on table "public"."sentinel_prover_runs" to "anon";

grant truncate on table "public"."sentinel_prover_runs" to "anon";

grant update on table "public"."sentinel_prover_runs" to "anon";

grant delete on table "public"."sentinel_prover_runs" to "authenticated";

grant insert on table "public"."sentinel_prover_runs" to "authenticated";

grant references on table "public"."sentinel_prover_runs" to "authenticated";

grant select on table "public"."sentinel_prover_runs" to "authenticated";

grant trigger on table "public"."sentinel_prover_runs" to "authenticated";

grant truncate on table "public"."sentinel_prover_runs" to "authenticated";

grant update on table "public"."sentinel_prover_runs" to "authenticated";

grant delete on table "public"."sentinel_prover_runs" to "service_role";

grant insert on table "public"."sentinel_prover_runs" to "service_role";

grant references on table "public"."sentinel_prover_runs" to "service_role";

grant select on table "public"."sentinel_prover_runs" to "service_role";

grant trigger on table "public"."sentinel_prover_runs" to "service_role";

grant truncate on table "public"."sentinel_prover_runs" to "service_role";

grant update on table "public"."sentinel_prover_runs" to "service_role";

grant delete on table "public"."sentinel_simulations" to "anon";

grant insert on table "public"."sentinel_simulations" to "anon";

grant references on table "public"."sentinel_simulations" to "anon";

grant select on table "public"."sentinel_simulations" to "anon";

grant trigger on table "public"."sentinel_simulations" to "anon";

grant truncate on table "public"."sentinel_simulations" to "anon";

grant update on table "public"."sentinel_simulations" to "anon";

grant delete on table "public"."sentinel_simulations" to "authenticated";

grant insert on table "public"."sentinel_simulations" to "authenticated";

grant references on table "public"."sentinel_simulations" to "authenticated";

grant select on table "public"."sentinel_simulations" to "authenticated";

grant trigger on table "public"."sentinel_simulations" to "authenticated";

grant truncate on table "public"."sentinel_simulations" to "authenticated";

grant update on table "public"."sentinel_simulations" to "authenticated";

grant delete on table "public"."sentinel_simulations" to "service_role";

grant insert on table "public"."sentinel_simulations" to "service_role";

grant references on table "public"."sentinel_simulations" to "service_role";

grant select on table "public"."sentinel_simulations" to "service_role";

grant trigger on table "public"."sentinel_simulations" to "service_role";

grant truncate on table "public"."sentinel_simulations" to "service_role";

grant update on table "public"."sentinel_simulations" to "service_role";

grant delete on table "public"."sentinel_team_invites" to "anon";

grant insert on table "public"."sentinel_team_invites" to "anon";

grant references on table "public"."sentinel_team_invites" to "anon";

grant select on table "public"."sentinel_team_invites" to "anon";

grant trigger on table "public"."sentinel_team_invites" to "anon";

grant truncate on table "public"."sentinel_team_invites" to "anon";

grant update on table "public"."sentinel_team_invites" to "anon";

grant delete on table "public"."sentinel_team_invites" to "authenticated";

grant insert on table "public"."sentinel_team_invites" to "authenticated";

grant references on table "public"."sentinel_team_invites" to "authenticated";

grant select on table "public"."sentinel_team_invites" to "authenticated";

grant trigger on table "public"."sentinel_team_invites" to "authenticated";

grant truncate on table "public"."sentinel_team_invites" to "authenticated";

grant update on table "public"."sentinel_team_invites" to "authenticated";

grant delete on table "public"."sentinel_team_invites" to "service_role";

grant insert on table "public"."sentinel_team_invites" to "service_role";

grant references on table "public"."sentinel_team_invites" to "service_role";

grant select on table "public"."sentinel_team_invites" to "service_role";

grant trigger on table "public"."sentinel_team_invites" to "service_role";

grant truncate on table "public"."sentinel_team_invites" to "service_role";

grant update on table "public"."sentinel_team_invites" to "service_role";

grant delete on table "public"."sentinel_team_members" to "anon";

grant insert on table "public"."sentinel_team_members" to "anon";

grant references on table "public"."sentinel_team_members" to "anon";

grant select on table "public"."sentinel_team_members" to "anon";

grant trigger on table "public"."sentinel_team_members" to "anon";

grant truncate on table "public"."sentinel_team_members" to "anon";

grant update on table "public"."sentinel_team_members" to "anon";

grant delete on table "public"."sentinel_team_members" to "authenticated";

grant insert on table "public"."sentinel_team_members" to "authenticated";

grant references on table "public"."sentinel_team_members" to "authenticated";

grant select on table "public"."sentinel_team_members" to "authenticated";

grant trigger on table "public"."sentinel_team_members" to "authenticated";

grant truncate on table "public"."sentinel_team_members" to "authenticated";

grant update on table "public"."sentinel_team_members" to "authenticated";

grant delete on table "public"."sentinel_team_members" to "service_role";

grant insert on table "public"."sentinel_team_members" to "service_role";

grant references on table "public"."sentinel_team_members" to "service_role";

grant select on table "public"."sentinel_team_members" to "service_role";

grant trigger on table "public"."sentinel_team_members" to "service_role";

grant truncate on table "public"."sentinel_team_members" to "service_role";

grant update on table "public"."sentinel_team_members" to "service_role";

grant delete on table "public"."sentinel_teams" to "anon";

grant insert on table "public"."sentinel_teams" to "anon";

grant references on table "public"."sentinel_teams" to "anon";

grant select on table "public"."sentinel_teams" to "anon";

grant trigger on table "public"."sentinel_teams" to "anon";

grant truncate on table "public"."sentinel_teams" to "anon";

grant update on table "public"."sentinel_teams" to "anon";

grant delete on table "public"."sentinel_teams" to "authenticated";

grant insert on table "public"."sentinel_teams" to "authenticated";

grant references on table "public"."sentinel_teams" to "authenticated";

grant select on table "public"."sentinel_teams" to "authenticated";

grant trigger on table "public"."sentinel_teams" to "authenticated";

grant truncate on table "public"."sentinel_teams" to "authenticated";

grant update on table "public"."sentinel_teams" to "authenticated";

grant delete on table "public"."sentinel_teams" to "service_role";

grant insert on table "public"."sentinel_teams" to "service_role";

grant references on table "public"."sentinel_teams" to "service_role";

grant select on table "public"."sentinel_teams" to "service_role";

grant trigger on table "public"."sentinel_teams" to "service_role";

grant truncate on table "public"."sentinel_teams" to "service_role";

grant update on table "public"."sentinel_teams" to "service_role";

grant delete on table "public"."sentinel_users" to "anon";

grant insert on table "public"."sentinel_users" to "anon";

grant references on table "public"."sentinel_users" to "anon";

grant select on table "public"."sentinel_users" to "anon";

grant trigger on table "public"."sentinel_users" to "anon";

grant truncate on table "public"."sentinel_users" to "anon";

grant update on table "public"."sentinel_users" to "anon";

grant delete on table "public"."sentinel_users" to "authenticated";

grant insert on table "public"."sentinel_users" to "authenticated";

grant references on table "public"."sentinel_users" to "authenticated";

grant select on table "public"."sentinel_users" to "authenticated";

grant trigger on table "public"."sentinel_users" to "authenticated";

grant truncate on table "public"."sentinel_users" to "authenticated";

grant update on table "public"."sentinel_users" to "authenticated";

grant delete on table "public"."sentinel_users" to "service_role";

grant insert on table "public"."sentinel_users" to "service_role";

grant references on table "public"."sentinel_users" to "service_role";

grant select on table "public"."sentinel_users" to "service_role";

grant trigger on table "public"."sentinel_users" to "service_role";

grant truncate on table "public"."sentinel_users" to "service_role";

grant update on table "public"."sentinel_users" to "service_role";

grant delete on table "public"."service_key_audit_log" to "anon";

grant insert on table "public"."service_key_audit_log" to "anon";

grant references on table "public"."service_key_audit_log" to "anon";

grant select on table "public"."service_key_audit_log" to "anon";

grant trigger on table "public"."service_key_audit_log" to "anon";

grant truncate on table "public"."service_key_audit_log" to "anon";

grant update on table "public"."service_key_audit_log" to "anon";

grant delete on table "public"."service_key_audit_log" to "authenticated";

grant insert on table "public"."service_key_audit_log" to "authenticated";

grant references on table "public"."service_key_audit_log" to "authenticated";

grant select on table "public"."service_key_audit_log" to "authenticated";

grant trigger on table "public"."service_key_audit_log" to "authenticated";

grant truncate on table "public"."service_key_audit_log" to "authenticated";

grant update on table "public"."service_key_audit_log" to "authenticated";

grant delete on table "public"."service_key_audit_log" to "service_role";

grant insert on table "public"."service_key_audit_log" to "service_role";

grant references on table "public"."service_key_audit_log" to "service_role";

grant select on table "public"."service_key_audit_log" to "service_role";

grant trigger on table "public"."service_key_audit_log" to "service_role";

grant truncate on table "public"."service_key_audit_log" to "service_role";

grant update on table "public"."service_key_audit_log" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";

grant delete on table "public"."shinroe_users" to "anon";

grant insert on table "public"."shinroe_users" to "anon";

grant references on table "public"."shinroe_users" to "anon";

grant select on table "public"."shinroe_users" to "anon";

grant trigger on table "public"."shinroe_users" to "anon";

grant truncate on table "public"."shinroe_users" to "anon";

grant update on table "public"."shinroe_users" to "anon";

grant delete on table "public"."shinroe_users" to "authenticated";

grant insert on table "public"."shinroe_users" to "authenticated";

grant references on table "public"."shinroe_users" to "authenticated";

grant select on table "public"."shinroe_users" to "authenticated";

grant trigger on table "public"."shinroe_users" to "authenticated";

grant truncate on table "public"."shinroe_users" to "authenticated";

grant update on table "public"."shinroe_users" to "authenticated";

grant delete on table "public"."shinroe_users" to "service_role";

grant insert on table "public"."shinroe_users" to "service_role";

grant references on table "public"."shinroe_users" to "service_role";

grant select on table "public"."shinroe_users" to "service_role";

grant trigger on table "public"."shinroe_users" to "service_role";

grant truncate on table "public"."shinroe_users" to "service_role";

grant update on table "public"."shinroe_users" to "service_role";

grant delete on table "public"."spatial_ref_sys" to "anon";

grant insert on table "public"."spatial_ref_sys" to "anon";

grant references on table "public"."spatial_ref_sys" to "anon";

grant select on table "public"."spatial_ref_sys" to "anon";

grant trigger on table "public"."spatial_ref_sys" to "anon";

grant truncate on table "public"."spatial_ref_sys" to "anon";

grant update on table "public"."spatial_ref_sys" to "anon";

grant delete on table "public"."spatial_ref_sys" to "authenticated";

grant insert on table "public"."spatial_ref_sys" to "authenticated";

grant references on table "public"."spatial_ref_sys" to "authenticated";

grant select on table "public"."spatial_ref_sys" to "authenticated";

grant trigger on table "public"."spatial_ref_sys" to "authenticated";

grant truncate on table "public"."spatial_ref_sys" to "authenticated";

grant update on table "public"."spatial_ref_sys" to "authenticated";

grant delete on table "public"."spatial_ref_sys" to "postgres";

grant insert on table "public"."spatial_ref_sys" to "postgres";

grant references on table "public"."spatial_ref_sys" to "postgres";

grant select on table "public"."spatial_ref_sys" to "postgres";

grant trigger on table "public"."spatial_ref_sys" to "postgres";

grant truncate on table "public"."spatial_ref_sys" to "postgres";

grant update on table "public"."spatial_ref_sys" to "postgres";

grant delete on table "public"."spatial_ref_sys" to "service_role";

grant insert on table "public"."spatial_ref_sys" to "service_role";

grant references on table "public"."spatial_ref_sys" to "service_role";

grant select on table "public"."spatial_ref_sys" to "service_role";

grant trigger on table "public"."spatial_ref_sys" to "service_role";

grant truncate on table "public"."spatial_ref_sys" to "service_role";

grant update on table "public"."spatial_ref_sys" to "service_role";

grant delete on table "public"."tangentx_market_stats" to "anon";

grant insert on table "public"."tangentx_market_stats" to "anon";

grant references on table "public"."tangentx_market_stats" to "anon";

grant select on table "public"."tangentx_market_stats" to "anon";

grant trigger on table "public"."tangentx_market_stats" to "anon";

grant truncate on table "public"."tangentx_market_stats" to "anon";

grant update on table "public"."tangentx_market_stats" to "anon";

grant delete on table "public"."tangentx_market_stats" to "authenticated";

grant insert on table "public"."tangentx_market_stats" to "authenticated";

grant references on table "public"."tangentx_market_stats" to "authenticated";

grant select on table "public"."tangentx_market_stats" to "authenticated";

grant trigger on table "public"."tangentx_market_stats" to "authenticated";

grant truncate on table "public"."tangentx_market_stats" to "authenticated";

grant update on table "public"."tangentx_market_stats" to "authenticated";

grant delete on table "public"."tangentx_market_stats" to "service_role";

grant insert on table "public"."tangentx_market_stats" to "service_role";

grant references on table "public"."tangentx_market_stats" to "service_role";

grant select on table "public"."tangentx_market_stats" to "service_role";

grant trigger on table "public"."tangentx_market_stats" to "service_role";

grant truncate on table "public"."tangentx_market_stats" to "service_role";

grant update on table "public"."tangentx_market_stats" to "service_role";

grant delete on table "public"."tangentx_markets" to "anon";

grant insert on table "public"."tangentx_markets" to "anon";

grant references on table "public"."tangentx_markets" to "anon";

grant select on table "public"."tangentx_markets" to "anon";

grant trigger on table "public"."tangentx_markets" to "anon";

grant truncate on table "public"."tangentx_markets" to "anon";

grant update on table "public"."tangentx_markets" to "anon";

grant delete on table "public"."tangentx_markets" to "authenticated";

grant insert on table "public"."tangentx_markets" to "authenticated";

grant references on table "public"."tangentx_markets" to "authenticated";

grant select on table "public"."tangentx_markets" to "authenticated";

grant trigger on table "public"."tangentx_markets" to "authenticated";

grant truncate on table "public"."tangentx_markets" to "authenticated";

grant update on table "public"."tangentx_markets" to "authenticated";

grant delete on table "public"."tangentx_markets" to "service_role";

grant insert on table "public"."tangentx_markets" to "service_role";

grant references on table "public"."tangentx_markets" to "service_role";

grant select on table "public"."tangentx_markets" to "service_role";

grant trigger on table "public"."tangentx_markets" to "service_role";

grant truncate on table "public"."tangentx_markets" to "service_role";

grant update on table "public"."tangentx_markets" to "service_role";

grant delete on table "public"."tangentx_positions" to "anon";

grant insert on table "public"."tangentx_positions" to "anon";

grant references on table "public"."tangentx_positions" to "anon";

grant select on table "public"."tangentx_positions" to "anon";

grant trigger on table "public"."tangentx_positions" to "anon";

grant truncate on table "public"."tangentx_positions" to "anon";

grant update on table "public"."tangentx_positions" to "anon";

grant delete on table "public"."tangentx_positions" to "authenticated";

grant insert on table "public"."tangentx_positions" to "authenticated";

grant references on table "public"."tangentx_positions" to "authenticated";

grant select on table "public"."tangentx_positions" to "authenticated";

grant trigger on table "public"."tangentx_positions" to "authenticated";

grant truncate on table "public"."tangentx_positions" to "authenticated";

grant update on table "public"."tangentx_positions" to "authenticated";

grant delete on table "public"."tangentx_positions" to "service_role";

grant insert on table "public"."tangentx_positions" to "service_role";

grant references on table "public"."tangentx_positions" to "service_role";

grant select on table "public"."tangentx_positions" to "service_role";

grant trigger on table "public"."tangentx_positions" to "service_role";

grant truncate on table "public"."tangentx_positions" to "service_role";

grant update on table "public"."tangentx_positions" to "service_role";

grant delete on table "public"."tangentx_trades" to "anon";

grant insert on table "public"."tangentx_trades" to "anon";

grant references on table "public"."tangentx_trades" to "anon";

grant select on table "public"."tangentx_trades" to "anon";

grant trigger on table "public"."tangentx_trades" to "anon";

grant truncate on table "public"."tangentx_trades" to "anon";

grant update on table "public"."tangentx_trades" to "anon";

grant delete on table "public"."tangentx_trades" to "authenticated";

grant insert on table "public"."tangentx_trades" to "authenticated";

grant references on table "public"."tangentx_trades" to "authenticated";

grant select on table "public"."tangentx_trades" to "authenticated";

grant trigger on table "public"."tangentx_trades" to "authenticated";

grant truncate on table "public"."tangentx_trades" to "authenticated";

grant update on table "public"."tangentx_trades" to "authenticated";

grant delete on table "public"."tangentx_trades" to "service_role";

grant insert on table "public"."tangentx_trades" to "service_role";

grant references on table "public"."tangentx_trades" to "service_role";

grant select on table "public"."tangentx_trades" to "service_role";

grant trigger on table "public"."tangentx_trades" to "service_role";

grant truncate on table "public"."tangentx_trades" to "service_role";

grant update on table "public"."tangentx_trades" to "service_role";

grant delete on table "public"."tangentx_users" to "anon";

grant insert on table "public"."tangentx_users" to "anon";

grant references on table "public"."tangentx_users" to "anon";

grant select on table "public"."tangentx_users" to "anon";

grant trigger on table "public"."tangentx_users" to "anon";

grant truncate on table "public"."tangentx_users" to "anon";

grant update on table "public"."tangentx_users" to "anon";

grant delete on table "public"."tangentx_users" to "authenticated";

grant insert on table "public"."tangentx_users" to "authenticated";

grant references on table "public"."tangentx_users" to "authenticated";

grant select on table "public"."tangentx_users" to "authenticated";

grant trigger on table "public"."tangentx_users" to "authenticated";

grant truncate on table "public"."tangentx_users" to "authenticated";

grant update on table "public"."tangentx_users" to "authenticated";

grant delete on table "public"."tangentx_users" to "service_role";

grant insert on table "public"."tangentx_users" to "service_role";

grant references on table "public"."tangentx_users" to "service_role";

grant select on table "public"."tangentx_users" to "service_role";

grant trigger on table "public"."tangentx_users" to "service_role";

grant truncate on table "public"."tangentx_users" to "service_role";

grant update on table "public"."tangentx_users" to "service_role";

grant delete on table "public"."task_dependencies" to "anon";

grant insert on table "public"."task_dependencies" to "anon";

grant references on table "public"."task_dependencies" to "anon";

grant select on table "public"."task_dependencies" to "anon";

grant trigger on table "public"."task_dependencies" to "anon";

grant truncate on table "public"."task_dependencies" to "anon";

grant update on table "public"."task_dependencies" to "anon";

grant delete on table "public"."task_dependencies" to "authenticated";

grant insert on table "public"."task_dependencies" to "authenticated";

grant references on table "public"."task_dependencies" to "authenticated";

grant select on table "public"."task_dependencies" to "authenticated";

grant trigger on table "public"."task_dependencies" to "authenticated";

grant truncate on table "public"."task_dependencies" to "authenticated";

grant update on table "public"."task_dependencies" to "authenticated";

grant delete on table "public"."task_dependencies" to "service_role";

grant insert on table "public"."task_dependencies" to "service_role";

grant references on table "public"."task_dependencies" to "service_role";

grant select on table "public"."task_dependencies" to "service_role";

grant trigger on table "public"."task_dependencies" to "service_role";

grant truncate on table "public"."task_dependencies" to "service_role";

grant update on table "public"."task_dependencies" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant references on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant trigger on table "public"."tasks" to "anon";

grant truncate on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant references on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant trigger on table "public"."tasks" to "authenticated";

grant truncate on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant references on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant trigger on table "public"."tasks" to "service_role";

grant truncate on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";

grant delete on table "public"."testnet_transactions" to "anon";

grant insert on table "public"."testnet_transactions" to "anon";

grant references on table "public"."testnet_transactions" to "anon";

grant select on table "public"."testnet_transactions" to "anon";

grant trigger on table "public"."testnet_transactions" to "anon";

grant truncate on table "public"."testnet_transactions" to "anon";

grant update on table "public"."testnet_transactions" to "anon";

grant delete on table "public"."testnet_transactions" to "authenticated";

grant insert on table "public"."testnet_transactions" to "authenticated";

grant references on table "public"."testnet_transactions" to "authenticated";

grant select on table "public"."testnet_transactions" to "authenticated";

grant trigger on table "public"."testnet_transactions" to "authenticated";

grant truncate on table "public"."testnet_transactions" to "authenticated";

grant update on table "public"."testnet_transactions" to "authenticated";

grant delete on table "public"."testnet_transactions" to "service_role";

grant insert on table "public"."testnet_transactions" to "service_role";

grant references on table "public"."testnet_transactions" to "service_role";

grant select on table "public"."testnet_transactions" to "service_role";

grant trigger on table "public"."testnet_transactions" to "service_role";

grant truncate on table "public"."testnet_transactions" to "service_role";

grant update on table "public"."testnet_transactions" to "service_role";

grant delete on table "public"."testnet_wallets" to "anon";

grant insert on table "public"."testnet_wallets" to "anon";

grant references on table "public"."testnet_wallets" to "anon";

grant select on table "public"."testnet_wallets" to "anon";

grant trigger on table "public"."testnet_wallets" to "anon";

grant truncate on table "public"."testnet_wallets" to "anon";

grant update on table "public"."testnet_wallets" to "anon";

grant delete on table "public"."testnet_wallets" to "authenticated";

grant insert on table "public"."testnet_wallets" to "authenticated";

grant references on table "public"."testnet_wallets" to "authenticated";

grant select on table "public"."testnet_wallets" to "authenticated";

grant trigger on table "public"."testnet_wallets" to "authenticated";

grant truncate on table "public"."testnet_wallets" to "authenticated";

grant update on table "public"."testnet_wallets" to "authenticated";

grant delete on table "public"."testnet_wallets" to "service_role";

grant insert on table "public"."testnet_wallets" to "service_role";

grant references on table "public"."testnet_wallets" to "service_role";

grant select on table "public"."testnet_wallets" to "service_role";

grant trigger on table "public"."testnet_wallets" to "service_role";

grant truncate on table "public"."testnet_wallets" to "service_role";

grant update on table "public"."testnet_wallets" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."urejesho_ai_proposals" to "anon";

grant insert on table "public"."urejesho_ai_proposals" to "anon";

grant references on table "public"."urejesho_ai_proposals" to "anon";

grant select on table "public"."urejesho_ai_proposals" to "anon";

grant trigger on table "public"."urejesho_ai_proposals" to "anon";

grant truncate on table "public"."urejesho_ai_proposals" to "anon";

grant update on table "public"."urejesho_ai_proposals" to "anon";

grant delete on table "public"."urejesho_ai_proposals" to "authenticated";

grant insert on table "public"."urejesho_ai_proposals" to "authenticated";

grant references on table "public"."urejesho_ai_proposals" to "authenticated";

grant select on table "public"."urejesho_ai_proposals" to "authenticated";

grant trigger on table "public"."urejesho_ai_proposals" to "authenticated";

grant truncate on table "public"."urejesho_ai_proposals" to "authenticated";

grant update on table "public"."urejesho_ai_proposals" to "authenticated";

grant delete on table "public"."urejesho_ai_proposals" to "service_role";

grant insert on table "public"."urejesho_ai_proposals" to "service_role";

grant references on table "public"."urejesho_ai_proposals" to "service_role";

grant select on table "public"."urejesho_ai_proposals" to "service_role";

grant trigger on table "public"."urejesho_ai_proposals" to "service_role";

grant truncate on table "public"."urejesho_ai_proposals" to "service_role";

grant update on table "public"."urejesho_ai_proposals" to "service_role";

grant delete on table "public"."urejesho_ai_verifications" to "anon";

grant insert on table "public"."urejesho_ai_verifications" to "anon";

grant references on table "public"."urejesho_ai_verifications" to "anon";

grant select on table "public"."urejesho_ai_verifications" to "anon";

grant trigger on table "public"."urejesho_ai_verifications" to "anon";

grant truncate on table "public"."urejesho_ai_verifications" to "anon";

grant update on table "public"."urejesho_ai_verifications" to "anon";

grant delete on table "public"."urejesho_ai_verifications" to "authenticated";

grant insert on table "public"."urejesho_ai_verifications" to "authenticated";

grant references on table "public"."urejesho_ai_verifications" to "authenticated";

grant select on table "public"."urejesho_ai_verifications" to "authenticated";

grant trigger on table "public"."urejesho_ai_verifications" to "authenticated";

grant truncate on table "public"."urejesho_ai_verifications" to "authenticated";

grant update on table "public"."urejesho_ai_verifications" to "authenticated";

grant delete on table "public"."urejesho_ai_verifications" to "service_role";

grant insert on table "public"."urejesho_ai_verifications" to "service_role";

grant references on table "public"."urejesho_ai_verifications" to "service_role";

grant select on table "public"."urejesho_ai_verifications" to "service_role";

grant trigger on table "public"."urejesho_ai_verifications" to "service_role";

grant truncate on table "public"."urejesho_ai_verifications" to "service_role";

grant update on table "public"."urejesho_ai_verifications" to "service_role";

grant delete on table "public"."urejesho_donations" to "anon";

grant insert on table "public"."urejesho_donations" to "anon";

grant references on table "public"."urejesho_donations" to "anon";

grant select on table "public"."urejesho_donations" to "anon";

grant trigger on table "public"."urejesho_donations" to "anon";

grant truncate on table "public"."urejesho_donations" to "anon";

grant update on table "public"."urejesho_donations" to "anon";

grant delete on table "public"."urejesho_donations" to "authenticated";

grant insert on table "public"."urejesho_donations" to "authenticated";

grant references on table "public"."urejesho_donations" to "authenticated";

grant select on table "public"."urejesho_donations" to "authenticated";

grant trigger on table "public"."urejesho_donations" to "authenticated";

grant truncate on table "public"."urejesho_donations" to "authenticated";

grant update on table "public"."urejesho_donations" to "authenticated";

grant delete on table "public"."urejesho_donations" to "service_role";

grant insert on table "public"."urejesho_donations" to "service_role";

grant references on table "public"."urejesho_donations" to "service_role";

grant select on table "public"."urejesho_donations" to "service_role";

grant trigger on table "public"."urejesho_donations" to "service_role";

grant truncate on table "public"."urejesho_donations" to "service_role";

grant update on table "public"."urejesho_donations" to "service_role";

grant delete on table "public"."urejesho_file_registry" to "anon";

grant insert on table "public"."urejesho_file_registry" to "anon";

grant references on table "public"."urejesho_file_registry" to "anon";

grant select on table "public"."urejesho_file_registry" to "anon";

grant trigger on table "public"."urejesho_file_registry" to "anon";

grant truncate on table "public"."urejesho_file_registry" to "anon";

grant update on table "public"."urejesho_file_registry" to "anon";

grant delete on table "public"."urejesho_file_registry" to "authenticated";

grant insert on table "public"."urejesho_file_registry" to "authenticated";

grant references on table "public"."urejesho_file_registry" to "authenticated";

grant select on table "public"."urejesho_file_registry" to "authenticated";

grant trigger on table "public"."urejesho_file_registry" to "authenticated";

grant truncate on table "public"."urejesho_file_registry" to "authenticated";

grant update on table "public"."urejesho_file_registry" to "authenticated";

grant delete on table "public"."urejesho_file_registry" to "service_role";

grant insert on table "public"."urejesho_file_registry" to "service_role";

grant references on table "public"."urejesho_file_registry" to "service_role";

grant select on table "public"."urejesho_file_registry" to "service_role";

grant trigger on table "public"."urejesho_file_registry" to "service_role";

grant truncate on table "public"."urejesho_file_registry" to "service_role";

grant update on table "public"."urejesho_file_registry" to "service_role";

grant delete on table "public"."urejesho_global_pool_config" to "anon";

grant insert on table "public"."urejesho_global_pool_config" to "anon";

grant references on table "public"."urejesho_global_pool_config" to "anon";

grant select on table "public"."urejesho_global_pool_config" to "anon";

grant trigger on table "public"."urejesho_global_pool_config" to "anon";

grant truncate on table "public"."urejesho_global_pool_config" to "anon";

grant update on table "public"."urejesho_global_pool_config" to "anon";

grant delete on table "public"."urejesho_global_pool_config" to "authenticated";

grant insert on table "public"."urejesho_global_pool_config" to "authenticated";

grant references on table "public"."urejesho_global_pool_config" to "authenticated";

grant select on table "public"."urejesho_global_pool_config" to "authenticated";

grant trigger on table "public"."urejesho_global_pool_config" to "authenticated";

grant truncate on table "public"."urejesho_global_pool_config" to "authenticated";

grant update on table "public"."urejesho_global_pool_config" to "authenticated";

grant delete on table "public"."urejesho_global_pool_config" to "service_role";

grant insert on table "public"."urejesho_global_pool_config" to "service_role";

grant references on table "public"."urejesho_global_pool_config" to "service_role";

grant select on table "public"."urejesho_global_pool_config" to "service_role";

grant trigger on table "public"."urejesho_global_pool_config" to "service_role";

grant truncate on table "public"."urejesho_global_pool_config" to "service_role";

grant update on table "public"."urejesho_global_pool_config" to "service_role";

grant delete on table "public"."urejesho_impact_badges" to "anon";

grant insert on table "public"."urejesho_impact_badges" to "anon";

grant references on table "public"."urejesho_impact_badges" to "anon";

grant select on table "public"."urejesho_impact_badges" to "anon";

grant trigger on table "public"."urejesho_impact_badges" to "anon";

grant truncate on table "public"."urejesho_impact_badges" to "anon";

grant update on table "public"."urejesho_impact_badges" to "anon";

grant delete on table "public"."urejesho_impact_badges" to "authenticated";

grant insert on table "public"."urejesho_impact_badges" to "authenticated";

grant references on table "public"."urejesho_impact_badges" to "authenticated";

grant select on table "public"."urejesho_impact_badges" to "authenticated";

grant trigger on table "public"."urejesho_impact_badges" to "authenticated";

grant truncate on table "public"."urejesho_impact_badges" to "authenticated";

grant update on table "public"."urejesho_impact_badges" to "authenticated";

grant delete on table "public"."urejesho_impact_badges" to "service_role";

grant insert on table "public"."urejesho_impact_badges" to "service_role";

grant references on table "public"."urejesho_impact_badges" to "service_role";

grant select on table "public"."urejesho_impact_badges" to "service_role";

grant trigger on table "public"."urejesho_impact_badges" to "service_role";

grant truncate on table "public"."urejesho_impact_badges" to "service_role";

grant update on table "public"."urejesho_impact_badges" to "service_role";

grant delete on table "public"."urejesho_milestones" to "anon";

grant insert on table "public"."urejesho_milestones" to "anon";

grant references on table "public"."urejesho_milestones" to "anon";

grant select on table "public"."urejesho_milestones" to "anon";

grant trigger on table "public"."urejesho_milestones" to "anon";

grant truncate on table "public"."urejesho_milestones" to "anon";

grant update on table "public"."urejesho_milestones" to "anon";

grant delete on table "public"."urejesho_milestones" to "authenticated";

grant insert on table "public"."urejesho_milestones" to "authenticated";

grant references on table "public"."urejesho_milestones" to "authenticated";

grant select on table "public"."urejesho_milestones" to "authenticated";

grant trigger on table "public"."urejesho_milestones" to "authenticated";

grant truncate on table "public"."urejesho_milestones" to "authenticated";

grant update on table "public"."urejesho_milestones" to "authenticated";

grant delete on table "public"."urejesho_milestones" to "service_role";

grant insert on table "public"."urejesho_milestones" to "service_role";

grant references on table "public"."urejesho_milestones" to "service_role";

grant select on table "public"."urejesho_milestones" to "service_role";

grant trigger on table "public"."urejesho_milestones" to "service_role";

grant truncate on table "public"."urejesho_milestones" to "service_role";

grant update on table "public"."urejesho_milestones" to "service_role";

grant delete on table "public"."urejesho_ngo_credentials" to "anon";

grant insert on table "public"."urejesho_ngo_credentials" to "anon";

grant references on table "public"."urejesho_ngo_credentials" to "anon";

grant select on table "public"."urejesho_ngo_credentials" to "anon";

grant trigger on table "public"."urejesho_ngo_credentials" to "anon";

grant truncate on table "public"."urejesho_ngo_credentials" to "anon";

grant update on table "public"."urejesho_ngo_credentials" to "anon";

grant delete on table "public"."urejesho_ngo_credentials" to "authenticated";

grant insert on table "public"."urejesho_ngo_credentials" to "authenticated";

grant references on table "public"."urejesho_ngo_credentials" to "authenticated";

grant select on table "public"."urejesho_ngo_credentials" to "authenticated";

grant trigger on table "public"."urejesho_ngo_credentials" to "authenticated";

grant truncate on table "public"."urejesho_ngo_credentials" to "authenticated";

grant update on table "public"."urejesho_ngo_credentials" to "authenticated";

grant delete on table "public"."urejesho_ngo_credentials" to "service_role";

grant insert on table "public"."urejesho_ngo_credentials" to "service_role";

grant references on table "public"."urejesho_ngo_credentials" to "service_role";

grant select on table "public"."urejesho_ngo_credentials" to "service_role";

grant trigger on table "public"."urejesho_ngo_credentials" to "service_role";

grant truncate on table "public"."urejesho_ngo_credentials" to "service_role";

grant update on table "public"."urejesho_ngo_credentials" to "service_role";

grant delete on table "public"."urejesho_ngos" to "anon";

grant insert on table "public"."urejesho_ngos" to "anon";

grant references on table "public"."urejesho_ngos" to "anon";

grant select on table "public"."urejesho_ngos" to "anon";

grant trigger on table "public"."urejesho_ngos" to "anon";

grant truncate on table "public"."urejesho_ngos" to "anon";

grant update on table "public"."urejesho_ngos" to "anon";

grant delete on table "public"."urejesho_ngos" to "authenticated";

grant insert on table "public"."urejesho_ngos" to "authenticated";

grant references on table "public"."urejesho_ngos" to "authenticated";

grant select on table "public"."urejesho_ngos" to "authenticated";

grant trigger on table "public"."urejesho_ngos" to "authenticated";

grant truncate on table "public"."urejesho_ngos" to "authenticated";

grant update on table "public"."urejesho_ngos" to "authenticated";

grant delete on table "public"."urejesho_ngos" to "service_role";

grant insert on table "public"."urejesho_ngos" to "service_role";

grant references on table "public"."urejesho_ngos" to "service_role";

grant select on table "public"."urejesho_ngos" to "service_role";

grant trigger on table "public"."urejesho_ngos" to "service_role";

grant truncate on table "public"."urejesho_ngos" to "service_role";

grant update on table "public"."urejesho_ngos" to "service_role";

grant delete on table "public"."urejesho_project_updates" to "anon";

grant insert on table "public"."urejesho_project_updates" to "anon";

grant references on table "public"."urejesho_project_updates" to "anon";

grant select on table "public"."urejesho_project_updates" to "anon";

grant trigger on table "public"."urejesho_project_updates" to "anon";

grant truncate on table "public"."urejesho_project_updates" to "anon";

grant update on table "public"."urejesho_project_updates" to "anon";

grant delete on table "public"."urejesho_project_updates" to "authenticated";

grant insert on table "public"."urejesho_project_updates" to "authenticated";

grant references on table "public"."urejesho_project_updates" to "authenticated";

grant select on table "public"."urejesho_project_updates" to "authenticated";

grant trigger on table "public"."urejesho_project_updates" to "authenticated";

grant truncate on table "public"."urejesho_project_updates" to "authenticated";

grant update on table "public"."urejesho_project_updates" to "authenticated";

grant delete on table "public"."urejesho_project_updates" to "service_role";

grant insert on table "public"."urejesho_project_updates" to "service_role";

grant references on table "public"."urejesho_project_updates" to "service_role";

grant select on table "public"."urejesho_project_updates" to "service_role";

grant trigger on table "public"."urejesho_project_updates" to "service_role";

grant truncate on table "public"."urejesho_project_updates" to "service_role";

grant update on table "public"."urejesho_project_updates" to "service_role";

grant delete on table "public"."urejesho_projects" to "anon";

grant insert on table "public"."urejesho_projects" to "anon";

grant references on table "public"."urejesho_projects" to "anon";

grant select on table "public"."urejesho_projects" to "anon";

grant trigger on table "public"."urejesho_projects" to "anon";

grant truncate on table "public"."urejesho_projects" to "anon";

grant update on table "public"."urejesho_projects" to "anon";

grant delete on table "public"."urejesho_projects" to "authenticated";

grant insert on table "public"."urejesho_projects" to "authenticated";

grant references on table "public"."urejesho_projects" to "authenticated";

grant select on table "public"."urejesho_projects" to "authenticated";

grant trigger on table "public"."urejesho_projects" to "authenticated";

grant truncate on table "public"."urejesho_projects" to "authenticated";

grant update on table "public"."urejesho_projects" to "authenticated";

grant delete on table "public"."urejesho_projects" to "service_role";

grant insert on table "public"."urejesho_projects" to "service_role";

grant references on table "public"."urejesho_projects" to "service_role";

grant select on table "public"."urejesho_projects" to "service_role";

grant trigger on table "public"."urejesho_projects" to "service_role";

grant truncate on table "public"."urejesho_projects" to "service_role";

grant update on table "public"."urejesho_projects" to "service_role";

grant delete on table "public"."urejesho_satellite_imagery" to "anon";

grant insert on table "public"."urejesho_satellite_imagery" to "anon";

grant references on table "public"."urejesho_satellite_imagery" to "anon";

grant select on table "public"."urejesho_satellite_imagery" to "anon";

grant trigger on table "public"."urejesho_satellite_imagery" to "anon";

grant truncate on table "public"."urejesho_satellite_imagery" to "anon";

grant update on table "public"."urejesho_satellite_imagery" to "anon";

grant delete on table "public"."urejesho_satellite_imagery" to "authenticated";

grant insert on table "public"."urejesho_satellite_imagery" to "authenticated";

grant references on table "public"."urejesho_satellite_imagery" to "authenticated";

grant select on table "public"."urejesho_satellite_imagery" to "authenticated";

grant trigger on table "public"."urejesho_satellite_imagery" to "authenticated";

grant truncate on table "public"."urejesho_satellite_imagery" to "authenticated";

grant update on table "public"."urejesho_satellite_imagery" to "authenticated";

grant delete on table "public"."urejesho_satellite_imagery" to "service_role";

grant insert on table "public"."urejesho_satellite_imagery" to "service_role";

grant references on table "public"."urejesho_satellite_imagery" to "service_role";

grant select on table "public"."urejesho_satellite_imagery" to "service_role";

grant trigger on table "public"."urejesho_satellite_imagery" to "service_role";

grant truncate on table "public"."urejesho_satellite_imagery" to "service_role";

grant update on table "public"."urejesho_satellite_imagery" to "service_role";

grant delete on table "public"."urejesho_saved_projects" to "anon";

grant insert on table "public"."urejesho_saved_projects" to "anon";

grant references on table "public"."urejesho_saved_projects" to "anon";

grant select on table "public"."urejesho_saved_projects" to "anon";

grant trigger on table "public"."urejesho_saved_projects" to "anon";

grant truncate on table "public"."urejesho_saved_projects" to "anon";

grant update on table "public"."urejesho_saved_projects" to "anon";

grant delete on table "public"."urejesho_saved_projects" to "authenticated";

grant insert on table "public"."urejesho_saved_projects" to "authenticated";

grant references on table "public"."urejesho_saved_projects" to "authenticated";

grant select on table "public"."urejesho_saved_projects" to "authenticated";

grant trigger on table "public"."urejesho_saved_projects" to "authenticated";

grant truncate on table "public"."urejesho_saved_projects" to "authenticated";

grant update on table "public"."urejesho_saved_projects" to "authenticated";

grant delete on table "public"."urejesho_saved_projects" to "service_role";

grant insert on table "public"."urejesho_saved_projects" to "service_role";

grant references on table "public"."urejesho_saved_projects" to "service_role";

grant select on table "public"."urejesho_saved_projects" to "service_role";

grant trigger on table "public"."urejesho_saved_projects" to "service_role";

grant truncate on table "public"."urejesho_saved_projects" to "service_role";

grant update on table "public"."urejesho_saved_projects" to "service_role";

grant delete on table "public"."urejesho_users" to "anon";

grant insert on table "public"."urejesho_users" to "anon";

grant references on table "public"."urejesho_users" to "anon";

grant select on table "public"."urejesho_users" to "anon";

grant trigger on table "public"."urejesho_users" to "anon";

grant truncate on table "public"."urejesho_users" to "anon";

grant update on table "public"."urejesho_users" to "anon";

grant delete on table "public"."urejesho_users" to "authenticated";

grant insert on table "public"."urejesho_users" to "authenticated";

grant references on table "public"."urejesho_users" to "authenticated";

grant select on table "public"."urejesho_users" to "authenticated";

grant trigger on table "public"."urejesho_users" to "authenticated";

grant truncate on table "public"."urejesho_users" to "authenticated";

grant update on table "public"."urejesho_users" to "authenticated";

grant delete on table "public"."urejesho_users" to "service_role";

grant insert on table "public"."urejesho_users" to "service_role";

grant references on table "public"."urejesho_users" to "service_role";

grant select on table "public"."urejesho_users" to "service_role";

grant trigger on table "public"."urejesho_users" to "service_role";

grant truncate on table "public"."urejesho_users" to "service_role";

grant update on table "public"."urejesho_users" to "service_role";

grant delete on table "public"."urejesho_vault_fee_accounts" to "anon";

grant insert on table "public"."urejesho_vault_fee_accounts" to "anon";

grant references on table "public"."urejesho_vault_fee_accounts" to "anon";

grant select on table "public"."urejesho_vault_fee_accounts" to "anon";

grant trigger on table "public"."urejesho_vault_fee_accounts" to "anon";

grant truncate on table "public"."urejesho_vault_fee_accounts" to "anon";

grant update on table "public"."urejesho_vault_fee_accounts" to "anon";

grant delete on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant insert on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant references on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant select on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant trigger on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant truncate on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant update on table "public"."urejesho_vault_fee_accounts" to "authenticated";

grant delete on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant insert on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant references on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant select on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant trigger on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant truncate on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant update on table "public"."urejesho_vault_fee_accounts" to "service_role";

grant delete on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant insert on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant references on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant select on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant trigger on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant truncate on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant update on table "public"."urejesho_vault_fee_monitoring_state" to "anon";

grant delete on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant insert on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant references on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant select on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant trigger on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant truncate on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant update on table "public"."urejesho_vault_fee_monitoring_state" to "authenticated";

grant delete on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant insert on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant references on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant select on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant trigger on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant truncate on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant update on table "public"."urejesho_vault_fee_monitoring_state" to "service_role";

grant delete on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant insert on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant references on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant select on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant trigger on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant truncate on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant update on table "public"."urejesho_vault_fee_monthly_schedule" to "anon";

grant delete on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant insert on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant references on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant select on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant trigger on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant truncate on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant update on table "public"."urejesho_vault_fee_monthly_schedule" to "authenticated";

grant delete on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant insert on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant references on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant select on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant trigger on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant truncate on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant update on table "public"."urejesho_vault_fee_monthly_schedule" to "service_role";

grant delete on table "public"."urejesho_vault_fee_transactions" to "anon";

grant insert on table "public"."urejesho_vault_fee_transactions" to "anon";

grant references on table "public"."urejesho_vault_fee_transactions" to "anon";

grant select on table "public"."urejesho_vault_fee_transactions" to "anon";

grant trigger on table "public"."urejesho_vault_fee_transactions" to "anon";

grant truncate on table "public"."urejesho_vault_fee_transactions" to "anon";

grant update on table "public"."urejesho_vault_fee_transactions" to "anon";

grant delete on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant insert on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant references on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant select on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant trigger on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant truncate on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant update on table "public"."urejesho_vault_fee_transactions" to "authenticated";

grant delete on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant insert on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant references on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant select on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant trigger on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant truncate on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant update on table "public"."urejesho_vault_fee_transactions" to "service_role";

grant delete on table "public"."urejesho_votes" to "anon";

grant insert on table "public"."urejesho_votes" to "anon";

grant references on table "public"."urejesho_votes" to "anon";

grant select on table "public"."urejesho_votes" to "anon";

grant trigger on table "public"."urejesho_votes" to "anon";

grant truncate on table "public"."urejesho_votes" to "anon";

grant update on table "public"."urejesho_votes" to "anon";

grant delete on table "public"."urejesho_votes" to "authenticated";

grant insert on table "public"."urejesho_votes" to "authenticated";

grant references on table "public"."urejesho_votes" to "authenticated";

grant select on table "public"."urejesho_votes" to "authenticated";

grant trigger on table "public"."urejesho_votes" to "authenticated";

grant truncate on table "public"."urejesho_votes" to "authenticated";

grant update on table "public"."urejesho_votes" to "authenticated";

grant delete on table "public"."urejesho_votes" to "service_role";

grant insert on table "public"."urejesho_votes" to "service_role";

grant references on table "public"."urejesho_votes" to "service_role";

grant select on table "public"."urejesho_votes" to "service_role";

grant trigger on table "public"."urejesho_votes" to "service_role";

grant truncate on table "public"."urejesho_votes" to "service_role";

grant update on table "public"."urejesho_votes" to "service_role";

grant delete on table "public"."urejesho_voting_proposals" to "anon";

grant insert on table "public"."urejesho_voting_proposals" to "anon";

grant references on table "public"."urejesho_voting_proposals" to "anon";

grant select on table "public"."urejesho_voting_proposals" to "anon";

grant trigger on table "public"."urejesho_voting_proposals" to "anon";

grant truncate on table "public"."urejesho_voting_proposals" to "anon";

grant update on table "public"."urejesho_voting_proposals" to "anon";

grant delete on table "public"."urejesho_voting_proposals" to "authenticated";

grant insert on table "public"."urejesho_voting_proposals" to "authenticated";

grant references on table "public"."urejesho_voting_proposals" to "authenticated";

grant select on table "public"."urejesho_voting_proposals" to "authenticated";

grant trigger on table "public"."urejesho_voting_proposals" to "authenticated";

grant truncate on table "public"."urejesho_voting_proposals" to "authenticated";

grant update on table "public"."urejesho_voting_proposals" to "authenticated";

grant delete on table "public"."urejesho_voting_proposals" to "service_role";

grant insert on table "public"."urejesho_voting_proposals" to "service_role";

grant references on table "public"."urejesho_voting_proposals" to "service_role";

grant select on table "public"."urejesho_voting_proposals" to "service_role";

grant trigger on table "public"."urejesho_voting_proposals" to "service_role";

grant truncate on table "public"."urejesho_voting_proposals" to "service_role";

grant update on table "public"."urejesho_voting_proposals" to "service_role";

grant delete on table "public"."vault_fee_accounts" to "anon";

grant insert on table "public"."vault_fee_accounts" to "anon";

grant references on table "public"."vault_fee_accounts" to "anon";

grant select on table "public"."vault_fee_accounts" to "anon";

grant trigger on table "public"."vault_fee_accounts" to "anon";

grant truncate on table "public"."vault_fee_accounts" to "anon";

grant update on table "public"."vault_fee_accounts" to "anon";

grant delete on table "public"."vault_fee_accounts" to "authenticated";

grant insert on table "public"."vault_fee_accounts" to "authenticated";

grant references on table "public"."vault_fee_accounts" to "authenticated";

grant select on table "public"."vault_fee_accounts" to "authenticated";

grant trigger on table "public"."vault_fee_accounts" to "authenticated";

grant truncate on table "public"."vault_fee_accounts" to "authenticated";

grant update on table "public"."vault_fee_accounts" to "authenticated";

grant delete on table "public"."vault_fee_accounts" to "service_role";

grant insert on table "public"."vault_fee_accounts" to "service_role";

grant references on table "public"."vault_fee_accounts" to "service_role";

grant select on table "public"."vault_fee_accounts" to "service_role";

grant trigger on table "public"."vault_fee_accounts" to "service_role";

grant truncate on table "public"."vault_fee_accounts" to "service_role";

grant update on table "public"."vault_fee_accounts" to "service_role";

grant delete on table "public"."vault_fee_transactions" to "anon";

grant insert on table "public"."vault_fee_transactions" to "anon";

grant references on table "public"."vault_fee_transactions" to "anon";

grant select on table "public"."vault_fee_transactions" to "anon";

grant trigger on table "public"."vault_fee_transactions" to "anon";

grant truncate on table "public"."vault_fee_transactions" to "anon";

grant update on table "public"."vault_fee_transactions" to "anon";

grant delete on table "public"."vault_fee_transactions" to "authenticated";

grant insert on table "public"."vault_fee_transactions" to "authenticated";

grant references on table "public"."vault_fee_transactions" to "authenticated";

grant select on table "public"."vault_fee_transactions" to "authenticated";

grant trigger on table "public"."vault_fee_transactions" to "authenticated";

grant truncate on table "public"."vault_fee_transactions" to "authenticated";

grant update on table "public"."vault_fee_transactions" to "authenticated";

grant delete on table "public"."vault_fee_transactions" to "service_role";

grant insert on table "public"."vault_fee_transactions" to "service_role";

grant references on table "public"."vault_fee_transactions" to "service_role";

grant select on table "public"."vault_fee_transactions" to "service_role";

grant trigger on table "public"."vault_fee_transactions" to "service_role";

grant truncate on table "public"."vault_fee_transactions" to "service_role";

grant update on table "public"."vault_fee_transactions" to "service_role";

grant delete on table "public"."velox_bid_transactions" to "anon";

grant insert on table "public"."velox_bid_transactions" to "anon";

grant references on table "public"."velox_bid_transactions" to "anon";

grant select on table "public"."velox_bid_transactions" to "anon";

grant trigger on table "public"."velox_bid_transactions" to "anon";

grant truncate on table "public"."velox_bid_transactions" to "anon";

grant update on table "public"."velox_bid_transactions" to "anon";

grant delete on table "public"."velox_bid_transactions" to "authenticated";

grant insert on table "public"."velox_bid_transactions" to "authenticated";

grant references on table "public"."velox_bid_transactions" to "authenticated";

grant select on table "public"."velox_bid_transactions" to "authenticated";

grant trigger on table "public"."velox_bid_transactions" to "authenticated";

grant truncate on table "public"."velox_bid_transactions" to "authenticated";

grant update on table "public"."velox_bid_transactions" to "authenticated";

grant delete on table "public"."velox_bid_transactions" to "service_role";

grant insert on table "public"."velox_bid_transactions" to "service_role";

grant references on table "public"."velox_bid_transactions" to "service_role";

grant select on table "public"."velox_bid_transactions" to "service_role";

grant trigger on table "public"."velox_bid_transactions" to "service_role";

grant truncate on table "public"."velox_bid_transactions" to "service_role";

grant update on table "public"."velox_bid_transactions" to "service_role";

grant delete on table "public"."velox_maker_transactions" to "anon";

grant insert on table "public"."velox_maker_transactions" to "anon";

grant references on table "public"."velox_maker_transactions" to "anon";

grant select on table "public"."velox_maker_transactions" to "anon";

grant trigger on table "public"."velox_maker_transactions" to "anon";

grant truncate on table "public"."velox_maker_transactions" to "anon";

grant update on table "public"."velox_maker_transactions" to "anon";

grant delete on table "public"."velox_maker_transactions" to "authenticated";

grant insert on table "public"."velox_maker_transactions" to "authenticated";

grant references on table "public"."velox_maker_transactions" to "authenticated";

grant select on table "public"."velox_maker_transactions" to "authenticated";

grant trigger on table "public"."velox_maker_transactions" to "authenticated";

grant truncate on table "public"."velox_maker_transactions" to "authenticated";

grant update on table "public"."velox_maker_transactions" to "authenticated";

grant delete on table "public"."velox_maker_transactions" to "service_role";

grant insert on table "public"."velox_maker_transactions" to "service_role";

grant references on table "public"."velox_maker_transactions" to "service_role";

grant select on table "public"."velox_maker_transactions" to "service_role";

grant trigger on table "public"."velox_maker_transactions" to "service_role";

grant truncate on table "public"."velox_maker_transactions" to "service_role";

grant update on table "public"."velox_maker_transactions" to "service_role";

grant delete on table "public"."velox_taker_transactions" to "anon";

grant insert on table "public"."velox_taker_transactions" to "anon";

grant references on table "public"."velox_taker_transactions" to "anon";

grant select on table "public"."velox_taker_transactions" to "anon";

grant trigger on table "public"."velox_taker_transactions" to "anon";

grant truncate on table "public"."velox_taker_transactions" to "anon";

grant update on table "public"."velox_taker_transactions" to "anon";

grant delete on table "public"."velox_taker_transactions" to "authenticated";

grant insert on table "public"."velox_taker_transactions" to "authenticated";

grant references on table "public"."velox_taker_transactions" to "authenticated";

grant select on table "public"."velox_taker_transactions" to "authenticated";

grant trigger on table "public"."velox_taker_transactions" to "authenticated";

grant truncate on table "public"."velox_taker_transactions" to "authenticated";

grant update on table "public"."velox_taker_transactions" to "authenticated";

grant delete on table "public"."velox_taker_transactions" to "service_role";

grant insert on table "public"."velox_taker_transactions" to "service_role";

grant references on table "public"."velox_taker_transactions" to "service_role";

grant select on table "public"."velox_taker_transactions" to "service_role";

grant trigger on table "public"."velox_taker_transactions" to "service_role";

grant truncate on table "public"."velox_taker_transactions" to "service_role";

grant update on table "public"."velox_taker_transactions" to "service_role";

grant delete on table "public"."wallets" to "anon";

grant insert on table "public"."wallets" to "anon";

grant references on table "public"."wallets" to "anon";

grant select on table "public"."wallets" to "anon";

grant trigger on table "public"."wallets" to "anon";

grant truncate on table "public"."wallets" to "anon";

grant update on table "public"."wallets" to "anon";

grant delete on table "public"."wallets" to "authenticated";

grant insert on table "public"."wallets" to "authenticated";

grant references on table "public"."wallets" to "authenticated";

grant select on table "public"."wallets" to "authenticated";

grant trigger on table "public"."wallets" to "authenticated";

grant truncate on table "public"."wallets" to "authenticated";

grant update on table "public"."wallets" to "authenticated";

grant delete on table "public"."wallets" to "service_role";

grant insert on table "public"."wallets" to "service_role";

grant references on table "public"."wallets" to "service_role";

grant select on table "public"."wallets" to "service_role";

grant trigger on table "public"."wallets" to "service_role";

grant truncate on table "public"."wallets" to "service_role";

grant update on table "public"."wallets" to "service_role";

grant delete on table "public"."workflows" to "anon";

grant insert on table "public"."workflows" to "anon";

grant references on table "public"."workflows" to "anon";

grant select on table "public"."workflows" to "anon";

grant trigger on table "public"."workflows" to "anon";

grant truncate on table "public"."workflows" to "anon";

grant update on table "public"."workflows" to "anon";

grant delete on table "public"."workflows" to "authenticated";

grant insert on table "public"."workflows" to "authenticated";

grant references on table "public"."workflows" to "authenticated";

grant select on table "public"."workflows" to "authenticated";

grant trigger on table "public"."workflows" to "authenticated";

grant truncate on table "public"."workflows" to "authenticated";

grant update on table "public"."workflows" to "authenticated";

grant delete on table "public"."workflows" to "service_role";

grant insert on table "public"."workflows" to "service_role";

grant references on table "public"."workflows" to "service_role";

grant select on table "public"."workflows" to "service_role";

grant trigger on table "public"."workflows" to "service_role";

grant truncate on table "public"."workflows" to "service_role";

grant update on table "public"."workflows" to "service_role";

grant delete on table "public"."yellowdotfun_comment_likes" to "anon";

grant insert on table "public"."yellowdotfun_comment_likes" to "anon";

grant references on table "public"."yellowdotfun_comment_likes" to "anon";

grant select on table "public"."yellowdotfun_comment_likes" to "anon";

grant trigger on table "public"."yellowdotfun_comment_likes" to "anon";

grant truncate on table "public"."yellowdotfun_comment_likes" to "anon";

grant update on table "public"."yellowdotfun_comment_likes" to "anon";

grant delete on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant insert on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant references on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant select on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant trigger on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant truncate on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant update on table "public"."yellowdotfun_comment_likes" to "authenticated";

grant delete on table "public"."yellowdotfun_comment_likes" to "service_role";

grant insert on table "public"."yellowdotfun_comment_likes" to "service_role";

grant references on table "public"."yellowdotfun_comment_likes" to "service_role";

grant select on table "public"."yellowdotfun_comment_likes" to "service_role";

grant trigger on table "public"."yellowdotfun_comment_likes" to "service_role";

grant truncate on table "public"."yellowdotfun_comment_likes" to "service_role";

grant update on table "public"."yellowdotfun_comment_likes" to "service_role";

grant delete on table "public"."yellowdotfun_comments" to "anon";

grant insert on table "public"."yellowdotfun_comments" to "anon";

grant references on table "public"."yellowdotfun_comments" to "anon";

grant select on table "public"."yellowdotfun_comments" to "anon";

grant trigger on table "public"."yellowdotfun_comments" to "anon";

grant truncate on table "public"."yellowdotfun_comments" to "anon";

grant update on table "public"."yellowdotfun_comments" to "anon";

grant delete on table "public"."yellowdotfun_comments" to "authenticated";

grant insert on table "public"."yellowdotfun_comments" to "authenticated";

grant references on table "public"."yellowdotfun_comments" to "authenticated";

grant select on table "public"."yellowdotfun_comments" to "authenticated";

grant trigger on table "public"."yellowdotfun_comments" to "authenticated";

grant truncate on table "public"."yellowdotfun_comments" to "authenticated";

grant update on table "public"."yellowdotfun_comments" to "authenticated";

grant delete on table "public"."yellowdotfun_comments" to "service_role";

grant insert on table "public"."yellowdotfun_comments" to "service_role";

grant references on table "public"."yellowdotfun_comments" to "service_role";

grant select on table "public"."yellowdotfun_comments" to "service_role";

grant trigger on table "public"."yellowdotfun_comments" to "service_role";

grant truncate on table "public"."yellowdotfun_comments" to "service_role";

grant update on table "public"."yellowdotfun_comments" to "service_role";

grant delete on table "public"."yellowdotfun_creator_earnings" to "anon";

grant insert on table "public"."yellowdotfun_creator_earnings" to "anon";

grant references on table "public"."yellowdotfun_creator_earnings" to "anon";

grant select on table "public"."yellowdotfun_creator_earnings" to "anon";

grant trigger on table "public"."yellowdotfun_creator_earnings" to "anon";

grant truncate on table "public"."yellowdotfun_creator_earnings" to "anon";

grant update on table "public"."yellowdotfun_creator_earnings" to "anon";

grant delete on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant insert on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant references on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant select on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant trigger on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant truncate on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant update on table "public"."yellowdotfun_creator_earnings" to "authenticated";

grant delete on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant insert on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant references on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant select on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant trigger on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant truncate on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant update on table "public"."yellowdotfun_creator_earnings" to "service_role";

grant delete on table "public"."yellowdotfun_tokens" to "anon";

grant insert on table "public"."yellowdotfun_tokens" to "anon";

grant references on table "public"."yellowdotfun_tokens" to "anon";

grant select on table "public"."yellowdotfun_tokens" to "anon";

grant trigger on table "public"."yellowdotfun_tokens" to "anon";

grant truncate on table "public"."yellowdotfun_tokens" to "anon";

grant update on table "public"."yellowdotfun_tokens" to "anon";

grant delete on table "public"."yellowdotfun_tokens" to "authenticated";

grant insert on table "public"."yellowdotfun_tokens" to "authenticated";

grant references on table "public"."yellowdotfun_tokens" to "authenticated";

grant select on table "public"."yellowdotfun_tokens" to "authenticated";

grant trigger on table "public"."yellowdotfun_tokens" to "authenticated";

grant truncate on table "public"."yellowdotfun_tokens" to "authenticated";

grant update on table "public"."yellowdotfun_tokens" to "authenticated";

grant delete on table "public"."yellowdotfun_tokens" to "service_role";

grant insert on table "public"."yellowdotfun_tokens" to "service_role";

grant references on table "public"."yellowdotfun_tokens" to "service_role";

grant select on table "public"."yellowdotfun_tokens" to "service_role";

grant trigger on table "public"."yellowdotfun_tokens" to "service_role";

grant truncate on table "public"."yellowdotfun_tokens" to "service_role";

grant update on table "public"."yellowdotfun_tokens" to "service_role";

grant delete on table "public"."yellowdotfun_top_holders" to "anon";

grant insert on table "public"."yellowdotfun_top_holders" to "anon";

grant references on table "public"."yellowdotfun_top_holders" to "anon";

grant select on table "public"."yellowdotfun_top_holders" to "anon";

grant trigger on table "public"."yellowdotfun_top_holders" to "anon";

grant truncate on table "public"."yellowdotfun_top_holders" to "anon";

grant update on table "public"."yellowdotfun_top_holders" to "anon";

grant delete on table "public"."yellowdotfun_top_holders" to "authenticated";

grant insert on table "public"."yellowdotfun_top_holders" to "authenticated";

grant references on table "public"."yellowdotfun_top_holders" to "authenticated";

grant select on table "public"."yellowdotfun_top_holders" to "authenticated";

grant trigger on table "public"."yellowdotfun_top_holders" to "authenticated";

grant truncate on table "public"."yellowdotfun_top_holders" to "authenticated";

grant update on table "public"."yellowdotfun_top_holders" to "authenticated";

grant delete on table "public"."yellowdotfun_top_holders" to "service_role";

grant insert on table "public"."yellowdotfun_top_holders" to "service_role";

grant references on table "public"."yellowdotfun_top_holders" to "service_role";

grant select on table "public"."yellowdotfun_top_holders" to "service_role";

grant trigger on table "public"."yellowdotfun_top_holders" to "service_role";

grant truncate on table "public"."yellowdotfun_top_holders" to "service_role";

grant update on table "public"."yellowdotfun_top_holders" to "service_role";

grant delete on table "public"."yellowdotfun_trades" to "anon";

grant insert on table "public"."yellowdotfun_trades" to "anon";

grant references on table "public"."yellowdotfun_trades" to "anon";

grant select on table "public"."yellowdotfun_trades" to "anon";

grant trigger on table "public"."yellowdotfun_trades" to "anon";

grant truncate on table "public"."yellowdotfun_trades" to "anon";

grant update on table "public"."yellowdotfun_trades" to "anon";

grant delete on table "public"."yellowdotfun_trades" to "authenticated";

grant insert on table "public"."yellowdotfun_trades" to "authenticated";

grant references on table "public"."yellowdotfun_trades" to "authenticated";

grant select on table "public"."yellowdotfun_trades" to "authenticated";

grant trigger on table "public"."yellowdotfun_trades" to "authenticated";

grant truncate on table "public"."yellowdotfun_trades" to "authenticated";

grant update on table "public"."yellowdotfun_trades" to "authenticated";

grant delete on table "public"."yellowdotfun_trades" to "service_role";

grant insert on table "public"."yellowdotfun_trades" to "service_role";

grant references on table "public"."yellowdotfun_trades" to "service_role";

grant select on table "public"."yellowdotfun_trades" to "service_role";

grant trigger on table "public"."yellowdotfun_trades" to "service_role";

grant truncate on table "public"."yellowdotfun_trades" to "service_role";

grant update on table "public"."yellowdotfun_trades" to "service_role";

grant delete on table "public"."yellowdotfun_user_balances" to "anon";

grant insert on table "public"."yellowdotfun_user_balances" to "anon";

grant references on table "public"."yellowdotfun_user_balances" to "anon";

grant select on table "public"."yellowdotfun_user_balances" to "anon";

grant trigger on table "public"."yellowdotfun_user_balances" to "anon";

grant truncate on table "public"."yellowdotfun_user_balances" to "anon";

grant update on table "public"."yellowdotfun_user_balances" to "anon";

grant delete on table "public"."yellowdotfun_user_balances" to "authenticated";

grant insert on table "public"."yellowdotfun_user_balances" to "authenticated";

grant references on table "public"."yellowdotfun_user_balances" to "authenticated";

grant select on table "public"."yellowdotfun_user_balances" to "authenticated";

grant trigger on table "public"."yellowdotfun_user_balances" to "authenticated";

grant truncate on table "public"."yellowdotfun_user_balances" to "authenticated";

grant update on table "public"."yellowdotfun_user_balances" to "authenticated";

grant delete on table "public"."yellowdotfun_user_balances" to "service_role";

grant insert on table "public"."yellowdotfun_user_balances" to "service_role";

grant references on table "public"."yellowdotfun_user_balances" to "service_role";

grant select on table "public"."yellowdotfun_user_balances" to "service_role";

grant trigger on table "public"."yellowdotfun_user_balances" to "service_role";

grant truncate on table "public"."yellowdotfun_user_balances" to "service_role";

grant update on table "public"."yellowdotfun_user_balances" to "service_role";

grant delete on table "public"."yellowdotfun_watchlist" to "anon";

grant insert on table "public"."yellowdotfun_watchlist" to "anon";

grant references on table "public"."yellowdotfun_watchlist" to "anon";

grant select on table "public"."yellowdotfun_watchlist" to "anon";

grant trigger on table "public"."yellowdotfun_watchlist" to "anon";

grant truncate on table "public"."yellowdotfun_watchlist" to "anon";

grant update on table "public"."yellowdotfun_watchlist" to "anon";

grant delete on table "public"."yellowdotfun_watchlist" to "authenticated";

grant insert on table "public"."yellowdotfun_watchlist" to "authenticated";

grant references on table "public"."yellowdotfun_watchlist" to "authenticated";

grant select on table "public"."yellowdotfun_watchlist" to "authenticated";

grant trigger on table "public"."yellowdotfun_watchlist" to "authenticated";

grant truncate on table "public"."yellowdotfun_watchlist" to "authenticated";

grant update on table "public"."yellowdotfun_watchlist" to "authenticated";

grant delete on table "public"."yellowdotfun_watchlist" to "service_role";

grant insert on table "public"."yellowdotfun_watchlist" to "service_role";

grant references on table "public"."yellowdotfun_watchlist" to "service_role";

grant select on table "public"."yellowdotfun_watchlist" to "service_role";

grant trigger on table "public"."yellowdotfun_watchlist" to "service_role";

grant truncate on table "public"."yellowdotfun_watchlist" to "service_role";

grant update on table "public"."yellowdotfun_watchlist" to "service_role";

grant delete on table "public"."yellowperps_level_history" to "anon";

grant insert on table "public"."yellowperps_level_history" to "anon";

grant references on table "public"."yellowperps_level_history" to "anon";

grant select on table "public"."yellowperps_level_history" to "anon";

grant trigger on table "public"."yellowperps_level_history" to "anon";

grant truncate on table "public"."yellowperps_level_history" to "anon";

grant update on table "public"."yellowperps_level_history" to "anon";

grant delete on table "public"."yellowperps_level_history" to "authenticated";

grant insert on table "public"."yellowperps_level_history" to "authenticated";

grant references on table "public"."yellowperps_level_history" to "authenticated";

grant select on table "public"."yellowperps_level_history" to "authenticated";

grant trigger on table "public"."yellowperps_level_history" to "authenticated";

grant truncate on table "public"."yellowperps_level_history" to "authenticated";

grant update on table "public"."yellowperps_level_history" to "authenticated";

grant delete on table "public"."yellowperps_level_history" to "service_role";

grant insert on table "public"."yellowperps_level_history" to "service_role";

grant references on table "public"."yellowperps_level_history" to "service_role";

grant select on table "public"."yellowperps_level_history" to "service_role";

grant trigger on table "public"."yellowperps_level_history" to "service_role";

grant truncate on table "public"."yellowperps_level_history" to "service_role";

grant update on table "public"."yellowperps_level_history" to "service_role";

grant delete on table "public"."yellowperps_positions" to "anon";

grant insert on table "public"."yellowperps_positions" to "anon";

grant references on table "public"."yellowperps_positions" to "anon";

grant select on table "public"."yellowperps_positions" to "anon";

grant trigger on table "public"."yellowperps_positions" to "anon";

grant truncate on table "public"."yellowperps_positions" to "anon";

grant update on table "public"."yellowperps_positions" to "anon";

grant delete on table "public"."yellowperps_positions" to "authenticated";

grant insert on table "public"."yellowperps_positions" to "authenticated";

grant references on table "public"."yellowperps_positions" to "authenticated";

grant select on table "public"."yellowperps_positions" to "authenticated";

grant trigger on table "public"."yellowperps_positions" to "authenticated";

grant truncate on table "public"."yellowperps_positions" to "authenticated";

grant update on table "public"."yellowperps_positions" to "authenticated";

grant delete on table "public"."yellowperps_positions" to "service_role";

grant insert on table "public"."yellowperps_positions" to "service_role";

grant references on table "public"."yellowperps_positions" to "service_role";

grant select on table "public"."yellowperps_positions" to "service_role";

grant trigger on table "public"."yellowperps_positions" to "service_role";

grant truncate on table "public"."yellowperps_positions" to "service_role";

grant update on table "public"."yellowperps_positions" to "service_role";

grant delete on table "public"."yellowperps_price_feeds" to "anon";

grant insert on table "public"."yellowperps_price_feeds" to "anon";

grant references on table "public"."yellowperps_price_feeds" to "anon";

grant select on table "public"."yellowperps_price_feeds" to "anon";

grant trigger on table "public"."yellowperps_price_feeds" to "anon";

grant truncate on table "public"."yellowperps_price_feeds" to "anon";

grant update on table "public"."yellowperps_price_feeds" to "anon";

grant delete on table "public"."yellowperps_price_feeds" to "authenticated";

grant insert on table "public"."yellowperps_price_feeds" to "authenticated";

grant references on table "public"."yellowperps_price_feeds" to "authenticated";

grant select on table "public"."yellowperps_price_feeds" to "authenticated";

grant trigger on table "public"."yellowperps_price_feeds" to "authenticated";

grant truncate on table "public"."yellowperps_price_feeds" to "authenticated";

grant update on table "public"."yellowperps_price_feeds" to "authenticated";

grant delete on table "public"."yellowperps_price_feeds" to "service_role";

grant insert on table "public"."yellowperps_price_feeds" to "service_role";

grant references on table "public"."yellowperps_price_feeds" to "service_role";

grant select on table "public"."yellowperps_price_feeds" to "service_role";

grant trigger on table "public"."yellowperps_price_feeds" to "service_role";

grant truncate on table "public"."yellowperps_price_feeds" to "service_role";

grant update on table "public"."yellowperps_price_feeds" to "service_role";

grant delete on table "public"."yellowperps_trades" to "anon";

grant insert on table "public"."yellowperps_trades" to "anon";

grant references on table "public"."yellowperps_trades" to "anon";

grant select on table "public"."yellowperps_trades" to "anon";

grant trigger on table "public"."yellowperps_trades" to "anon";

grant truncate on table "public"."yellowperps_trades" to "anon";

grant update on table "public"."yellowperps_trades" to "anon";

grant delete on table "public"."yellowperps_trades" to "authenticated";

grant insert on table "public"."yellowperps_trades" to "authenticated";

grant references on table "public"."yellowperps_trades" to "authenticated";

grant select on table "public"."yellowperps_trades" to "authenticated";

grant trigger on table "public"."yellowperps_trades" to "authenticated";

grant truncate on table "public"."yellowperps_trades" to "authenticated";

grant update on table "public"."yellowperps_trades" to "authenticated";

grant delete on table "public"."yellowperps_trades" to "service_role";

grant insert on table "public"."yellowperps_trades" to "service_role";

grant references on table "public"."yellowperps_trades" to "service_role";

grant select on table "public"."yellowperps_trades" to "service_role";

grant trigger on table "public"."yellowperps_trades" to "service_role";

grant truncate on table "public"."yellowperps_trades" to "service_role";

grant update on table "public"."yellowperps_trades" to "service_role";

grant delete on table "public"."yellowperps_transactions" to "anon";

grant insert on table "public"."yellowperps_transactions" to "anon";

grant references on table "public"."yellowperps_transactions" to "anon";

grant select on table "public"."yellowperps_transactions" to "anon";

grant trigger on table "public"."yellowperps_transactions" to "anon";

grant truncate on table "public"."yellowperps_transactions" to "anon";

grant update on table "public"."yellowperps_transactions" to "anon";

grant delete on table "public"."yellowperps_transactions" to "authenticated";

grant insert on table "public"."yellowperps_transactions" to "authenticated";

grant references on table "public"."yellowperps_transactions" to "authenticated";

grant select on table "public"."yellowperps_transactions" to "authenticated";

grant trigger on table "public"."yellowperps_transactions" to "authenticated";

grant truncate on table "public"."yellowperps_transactions" to "authenticated";

grant update on table "public"."yellowperps_transactions" to "authenticated";

grant delete on table "public"."yellowperps_transactions" to "service_role";

grant insert on table "public"."yellowperps_transactions" to "service_role";

grant references on table "public"."yellowperps_transactions" to "service_role";

grant select on table "public"."yellowperps_transactions" to "service_role";

grant trigger on table "public"."yellowperps_transactions" to "service_role";

grant truncate on table "public"."yellowperps_transactions" to "service_role";

grant update on table "public"."yellowperps_transactions" to "service_role";

grant delete on table "public"."yellowperps_users" to "anon";

grant insert on table "public"."yellowperps_users" to "anon";

grant references on table "public"."yellowperps_users" to "anon";

grant select on table "public"."yellowperps_users" to "anon";

grant trigger on table "public"."yellowperps_users" to "anon";

grant truncate on table "public"."yellowperps_users" to "anon";

grant update on table "public"."yellowperps_users" to "anon";

grant delete on table "public"."yellowperps_users" to "authenticated";

grant insert on table "public"."yellowperps_users" to "authenticated";

grant references on table "public"."yellowperps_users" to "authenticated";

grant select on table "public"."yellowperps_users" to "authenticated";

grant trigger on table "public"."yellowperps_users" to "authenticated";

grant truncate on table "public"."yellowperps_users" to "authenticated";

grant update on table "public"."yellowperps_users" to "authenticated";

grant delete on table "public"."yellowperps_users" to "service_role";

grant insert on table "public"."yellowperps_users" to "service_role";

grant references on table "public"."yellowperps_users" to "service_role";

grant select on table "public"."yellowperps_users" to "service_role";

grant trigger on table "public"."yellowperps_users" to "service_role";

grant truncate on table "public"."yellowperps_users" to "service_role";

grant update on table "public"."yellowperps_users" to "service_role";


  create policy "ember_chat_allow_all"
  on "public"."ember_chat_messages"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "ember_streams_allow_all"
  on "public"."ember_streams"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "labang_daily_earnings_insert_any"
  on "public"."labang_daily_earnings"
  as permissive
  for insert
  to public
with check (true);



  create policy "labang_daily_earnings_select_own"
  on "public"."labang_daily_earnings"
  as permissive
  for select
  to public
using ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "labang_daily_earnings_update_own"
  on "public"."labang_daily_earnings"
  as permissive
  for update
  to public
using ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "labang_rewards_insert_any"
  on "public"."labang_rewards"
  as permissive
  for insert
  to public
with check (true);



  create policy "labang_rewards_select_own"
  on "public"."labang_rewards"
  as permissive
  for select
  to public
using ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "labang_rewards_update_own"
  on "public"."labang_rewards"
  as permissive
  for update
  to public
using ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "labang_watch_sessions_insert_own"
  on "public"."labang_watch_sessions"
  as permissive
  for insert
  to public
with check ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "labang_watch_sessions_select_own"
  on "public"."labang_watch_sessions"
  as permissive
  for select
  to public
using ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "labang_watch_sessions_update_own"
  on "public"."labang_watch_sessions"
  as permissive
  for update
  to public
using ((user_address = current_setting('app.wallet_address'::text, true)));



  create policy "Allow all operations on project_wallets for now"
  on "public"."project_wallets"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow public insert to IPFS metadata"
  on "public"."salvation_ipfs_metadata"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow public read access to IPFS metadata"
  on "public"."salvation_ipfs_metadata"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER agent_pay_services_updated_at BEFORE UPDATE ON public.agent_pay_services FOR EACH ROW EXECUTE FUNCTION public.agent_pay_update_updated_at();

CREATE TRIGGER update_animoca_credential_schemas_updated_at BEFORE UPDATE ON public.animoca_credential_schemas FOR EACH ROW EXECUTE FUNCTION public.animoca_update_updated_at_column();

CREATE TRIGGER update_animoca_influencers_updated_at BEFORE UPDATE ON public.animoca_influencers FOR EACH ROW EXECUTE FUNCTION public.animoca_update_updated_at_column();

CREATE TRIGGER dxyperps_update_positions_updated_at BEFORE UPDATE ON public.dxyperps_positions FOR EACH ROW EXECUTE FUNCTION public.dxyperps_update_updated_at_column();

CREATE TRIGGER dxyperps_update_trader_stats_trigger AFTER UPDATE ON public.dxyperps_positions FOR EACH ROW EXECUTE FUNCTION public.dxyperps_update_trader_stats();

CREATE TRIGGER dxyperps_update_traders_updated_at BEFORE UPDATE ON public.dxyperps_traders FOR EACH ROW EXECUTE FUNCTION public.dxyperps_update_updated_at_column();

CREATE TRIGGER trigger_ember_order_details_updated_at BEFORE UPDATE ON public.ember_order_details FOR EACH ROW EXECUTE FUNCTION public.update_ember_order_details_updated_at();

CREATE TRIGGER update_konstant_nicknames_updated_at BEFORE UPDATE ON public.konstant_nicknames FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_konstant_profiles_updated_at BEFORE UPDATE ON public.konstant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER labang_orders_updated_at BEFORE UPDATE ON public.labang_orders FOR EACH ROW EXECUTE FUNCTION public.labang_update_updated_at();

CREATE TRIGGER labang_products_updated_at BEFORE UPDATE ON public.labang_products FOR EACH ROW EXECUTE FUNCTION public.labang_update_updated_at();

CREATE TRIGGER labang_sellers_updated_at BEFORE UPDATE ON public.labang_sellers FOR EACH ROW EXECUTE FUNCTION public.labang_update_updated_at();

CREATE TRIGGER update_clusters_updated_at BEFORE UPDATE ON public.mocat_ai_clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expert_follower_count AFTER INSERT OR DELETE OR UPDATE ON public.mocat_ai_follows FOR EACH ROW EXECUTE FUNCTION public.update_expert_trader_followers();

CREATE TRIGGER update_agent_stats_on_validation AFTER INSERT ON public.mocat_ai_signal_validations FOR EACH ROW EXECUTE FUNCTION public.update_ai_agent_stats();

CREATE TRIGGER update_expert_stats_on_signal_close BEFORE UPDATE ON public.mocat_ai_trading_signals FOR EACH ROW EXECUTE FUNCTION public.update_expert_trader_stats();

CREATE TRIGGER salvation_businesses_updated_at BEFORE UPDATE ON public.salvation_businesses FOR EACH ROW EXECUTE FUNCTION public.salvation_update_updated_at();

CREATE TRIGGER salvation_project_applications_updated_at BEFORE UPDATE ON public.salvation_project_applications FOR EACH ROW EXECUTE FUNCTION public.salvation_update_updated_at();

CREATE TRIGGER sentinel_projects_updated_at BEFORE UPDATE ON public.sentinel_projects FOR EACH ROW EXECUTE FUNCTION public.sentinel_update_updated_at();

CREATE TRIGGER sentinel_teams_updated_at BEFORE UPDATE ON public.sentinel_teams FOR EACH ROW EXECUTE FUNCTION public.sentinel_update_updated_at();

CREATE TRIGGER sentinel_users_updated_at BEFORE UPDATE ON public.sentinel_users FOR EACH ROW EXECUTE FUNCTION public.sentinel_update_updated_at();

CREATE TRIGGER set_shinroe_users_updated_at BEFORE UPDATE ON public.shinroe_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_file_registry_timestamp BEFORE UPDATE ON public.urejesho_file_registry FOR EACH ROW EXECUTE FUNCTION public.update_file_registry_updated_at();

CREATE TRIGGER update_urejesho_global_pool_config_updated_at BEFORE UPDATE ON public.urejesho_global_pool_config FOR EACH ROW EXECUTE FUNCTION public.urejesho_update_updated_at_column();

CREATE TRIGGER update_urejesho_milestones_updated_at BEFORE UPDATE ON public.urejesho_milestones FOR EACH ROW EXECUTE FUNCTION public.urejesho_update_updated_at_column();

CREATE TRIGGER trigger_update_ngo_credentials_timestamp BEFORE UPDATE ON public.urejesho_ngo_credentials FOR EACH ROW EXECUTE FUNCTION public.update_ngo_credentials_updated_at();

CREATE TRIGGER update_urejesho_ngos_updated_at BEFORE UPDATE ON public.urejesho_ngos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_project_updates_timestamp BEFORE UPDATE ON public.urejesho_project_updates FOR EACH ROW EXECUTE FUNCTION public.update_project_updates_updated_at();

CREATE TRIGGER update_urejesho_projects_updated_at BEFORE UPDATE ON public.urejesho_projects FOR EACH ROW EXECUTE FUNCTION public.urejesho_update_updated_at_column();

CREATE TRIGGER update_urejesho_users_updated_at BEFORE UPDATE ON public.urejesho_users FOR EACH ROW EXECUTE FUNCTION public.urejesho_update_updated_at_column();

CREATE TRIGGER update_urejesho_voting_proposals_updated_at BEFORE UPDATE ON public.urejesho_voting_proposals FOR EACH ROW EXECUTE FUNCTION public.urejesho_update_updated_at_column();

CREATE TRIGGER vault_fee_accounts_updated_at BEFORE UPDATE ON public.vault_fee_accounts FOR EACH ROW EXECUTE FUNCTION public.update_vault_fee_account_updated_at();

CREATE TRIGGER yellowdotfun_update_comment_likes_count_trigger AFTER INSERT OR DELETE ON public.yellowdotfun_comment_likes FOR EACH ROW EXECUTE FUNCTION public.yellowdotfun_update_comment_likes_count();

CREATE TRIGGER yellowdotfun_trigger_update_creator_earnings AFTER INSERT ON public.yellowdotfun_trades FOR EACH ROW EXECUTE FUNCTION public.yellowdotfun_update_creator_earnings();

CREATE TRIGGER yellowdotfun_trigger_update_token_stats AFTER INSERT ON public.yellowdotfun_trades FOR EACH ROW EXECUTE FUNCTION public.yellowdotfun_update_token_stats_on_trade();

CREATE TRIGGER yellowdotfun_trigger_update_holder_count AFTER INSERT OR UPDATE OF balance ON public.yellowdotfun_user_balances FOR EACH ROW EXECUTE FUNCTION public.yellowdotfun_update_holder_count();


  create policy "Public read access for salvation_images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'salvation_images'::text));



  create policy "Service role delete for salvation_images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'salvation_images'::text));



  create policy "Service role update for salvation_images"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'salvation_images'::text));



  create policy "Service role upload for salvation_images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'salvation_images'::text));



