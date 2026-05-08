import { Migration } from '@mikro-orm/migrations';

export class Migration20260428120810_Initial extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "agent_tools" ("id" uuid not null, "user_id" uuid not null, "name" varchar(255) not null, "permission" varchar(255) not null, "scopes" jsonb not null, "token" varchar(255) not null, constraint "agent_tools_pkey" primary key ("id"));`);
    this.addSql(`create index "agent_tools_user_id_index" on "agent_tools" ("user_id");`);

    this.addSql(`create table "features" ("id" uuid not null, "project_id" uuid not null, "name" varchar(255) not null, "description" text not null, "documents" jsonb not null, constraint "features_pkey" primary key ("id"));`);
    this.addSql(`create index "features_project_id_index" on "features" ("project_id");`);

    this.addSql(`create table "ideas" ("id" uuid not null, "description" text not null, "documents" jsonb not null, "links" jsonb not null, constraint "ideas_pkey" primary key ("id"));`);

    this.addSql(`create table "page_layouts" ("id" uuid not null, "page_type" varchar(255) not null, "page_ref" uuid not null, "sections" jsonb not null, constraint "page_layouts_pkey" primary key ("id"));`);
    this.addSql(`alter table "page_layouts" add constraint "page_layouts_page_type_page_ref_unique" unique ("page_type", "page_ref");`);

    this.addSql(`create table "portfolios" ("id" uuid not null, "user_id" uuid not null, "description" text not null, "languages" jsonb not null, "links" jsonb not null, constraint "portfolios_pkey" primary key ("id"));`);
    this.addSql(`alter table "portfolios" add constraint "portfolios_user_id_unique" unique ("user_id");`);

    this.addSql(`create table "projects" ("id" uuid not null, "description" text not null, "documents" jsonb not null, "links" jsonb not null, constraint "projects_pkey" primary key ("id"));`);

    this.addSql(`create table "tickets" ("id" uuid not null, "reference" varchar(255) not null, "feature_id" uuid not null, "title" varchar(255) not null, "description" text not null, "status" varchar(255) not null, "notes" jsonb not null, "documents" jsonb not null, constraint "tickets_pkey" primary key ("id"));`);
    this.addSql(`alter table "tickets" add constraint "tickets_reference_unique" unique ("reference");`);
    this.addSql(`create index "tickets_feature_id_index" on "tickets" ("feature_id");`);

    this.addSql(`create table "users" ("id" uuid not null, "name" varchar(255) not null, "surname" varchar(255) not null, "email" varchar(255) not null, "roles" jsonb not null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "agent_tools" cascade;`);

    this.addSql(`drop table if exists "features" cascade;`);

    this.addSql(`drop table if exists "ideas" cascade;`);

    this.addSql(`drop table if exists "page_layouts" cascade;`);

    this.addSql(`drop table if exists "portfolios" cascade;`);

    this.addSql(`drop table if exists "projects" cascade;`);

    this.addSql(`drop table if exists "tickets" cascade;`);

    this.addSql(`drop table if exists "users" cascade;`);
  }

}
