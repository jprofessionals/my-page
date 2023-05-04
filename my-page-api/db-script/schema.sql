

create table budget_type
(
    id                            bigint auto_increment
        primary key,
    deposit                       double       not null,
    interval_of_deposit_in_months bigint       not null,
    name                          varchar(255) null,
    roll_over                     bit          not null,
    start_amount                  double       not null,
    allow_time_balance            bit          not null
)
    engine = InnoDB;

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
)
    engine = InnoDB;

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
)
    engine = InnoDB;

create table hours
(
    id            bigint auto_increment
        primary key,
    created_by    varchar(255) null,
    created_date  datetime(6)  null,
    hours         int          not null,
    budget_id     bigint       null,
    date_of_usage date         null,
    constraint FKaqc2ugd8kcwd0rm8qiaftvosx
        foreign key (budget_id) references budget (id)
)
    engine = InnoDB;

create table post
(
    id                 bigint auto_increment
        primary key,
    amount_ex_mva      double       null,
    amount_inc_mva     double       null,
    created_date       datetime(6)  null,
    date               date         null,
    date_of_deduction  date         null,
    date_of_payment    date         null,
    description        varchar(255) null,
    document_number    varchar(255) null,
    expense            bit          not null,
    last_modified_date datetime(6)  null,
    locked             bit          not null,
    budget_id          bigint       null,
    created_by_id      bigint       null,
    constraint FK579l3cu9thlt9m3co9595xr5v
        foreign key (created_by_id) references user (id),
    constraint FKfgnwi0hv1n20w7ks1n0ohl00t
        foreign key (budget_id) references budget (id)
)
    engine = InnoDB;

