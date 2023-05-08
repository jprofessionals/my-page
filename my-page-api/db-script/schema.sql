create table budget_type
(
    id                            bigint auto_increment
        primary key,
    deposit                       double       not null,
    interval_of_deposit_in_months bigint       not null,
    name                          varchar(255) null,
    roll_over                     bit          not null,
    start_amount                  double       not null,
    allow_time_balance            bit          not null,
    `default`                     bit          not null
);

create table job_posting
(
    id                           bigint auto_increment
        primary key,
    customer                     varchar(255) null,
    description                  longtext     null,
    due_date_for_application     date         null,
    location                     varchar(255) null,
    required_years_of_experience int          null,
    resources_needed             int          null,
    title                        varchar(255) null
);

create table tags
(
    id   bigint auto_increment
        primary key,
    name varchar(255) not null
);

create table job_posting_tags
(
    job_posting_id bigint not null,
    tag_id         bigint not null,
    primary key (job_posting_id, tag_id),
    constraint FK_job_posting_tags_job_posting
        foreign key (job_posting_id) references job_posting (id),
    constraint FK_job_posting_tags_tags
        foreign key (tag_id) references tags (id)
);

create table user
(
    id              bigint auto_increment
        primary key,
    admin           bit          not null,
    email           varchar(255) null,
    employee_number int          null,
    family_name     varchar(255) null,
    given_name      varchar(255) null,
    icon            varchar(255) null,
    name            varchar(255) null,
    nick_name       varchar(255) null,
    start_date      date         null,
    sub             varchar(255) null,
    constraint email
        unique (email)
);

create table budget
(
    id             bigint auto_increment
        primary key,
    start_amount   double not null,
    start_date     date   null,
    budget_type_id bigint null,
    user_id        bigint null,
    constraint UC_User_Budget_Type
        unique (user_id, budget_type_id),
    constraint FKkuh8cj1roovp9nh6ut2igrxm2
        foreign key (user_id) references user (id),
    constraint FKkv7b1cicwa2gqdqu72hwaai2p
        foreign key (budget_type_id) references budget_type (id)
);

create table hours
(
    id            bigint auto_increment
        primary key,
    created_by    varchar(255) null,
    created_date  datetime     null,
    hours         int          not null,
    budget_id     bigint       null,
    date_of_usage date         null,
    constraint FKaqc2ugd8kcwd0rm8qiaftvosx
        foreign key (budget_id) references budget (id)
);

create table post
(
    id                 bigint auto_increment
        primary key,
    amount_ex_mva      double       null,
    amount_inc_mva     double       null,
    created_date       datetime     null,
    date               date         null,
    date_of_deduction  date         null,
    date_of_payment    date         null,
    description        varchar(255) null,
    document_number    varchar(255) null,
    expense            bit          not null,
    last_modified_date datetime     null,
    locked             bit          not null,
    budget_id          bigint       null,
    created_by_id      bigint       null,
    constraint FK579l3cu9thlt9m3co9595xr5v
        foreign key (created_by_id) references user (id),
    constraint FKfgnwi0hv1n20w7ks1n0ohl00t
        foreign key (budget_id) references budget (id)
);

