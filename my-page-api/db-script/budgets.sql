-- Budget types
INSERT INTO mypage.budget_type (deposit, interval_of_deposit_in_months, name, roll_over, start_amount, allow_time_balance, `default`) VALUES (700, 1, 'Laptop', true, 25000, false, true);
INSERT INTO mypage.budget_type (deposit, interval_of_deposit_in_months, name, roll_over, start_amount, allow_time_balance, `default`) VALUES (330, 1, 'Mobil', true, 8000, false, true);
INSERT INTO mypage.budget_type (deposit, interval_of_deposit_in_months, name, roll_over, start_amount, allow_time_balance, `default`) VALUES (0, 1, 'Kompetanse', false, 50000, true, true);
INSERT INTO mypage.budget_type (deposit, interval_of_deposit_in_months, name, roll_over, start_amount, allow_time_balance, `default`) VALUES (0, 1, 'Hjemmekontor', true, 0, false, true);
INSERT INTO mypage.budget_type (deposit, interval_of_deposit_in_months, name, roll_over, start_amount, allow_time_balance, `default`) VALUES (0, 1, 'Bruttotrekk', true, 0, false, true);

-- Create budgets for all users
insert into budget(start_amount, start_date, budget_type_id, user_id)
select bt.start_amount, u.start_date, bt.id, u.id
from user u
         join budget_type bt;

-- Create budget post for alle budgets
insert into post(amount_ex_mva, date, description, expense, locked, budget_id)
select FLOOR(RAND() * (10000 - 100 + 1)) + 100,
       CURRENT_DATE - INTERVAL FLOOR(RAND() * 400) DAY,
    t.title,
    false,
    true,
    b.id
from (SELECT 'liten ting' as title union select 'stor ting' as title union select 'rar ting' as title union select 'ingenting' as title) t
    join budget b
    join user u on b.user_id = u.id;

-- Create hours for all applicable budgets
insert into hours(budget_id, hours, date_of_usage)
select budget.id, FLOOR(RAND() * 10), CURRENT_DATE - INTERVAL FLOOR(RAND() * 365) DAY from budget
    join budget_type bt on bt.id = budget.budget_type_id
where bt.allow_time_balance;

insert into hours(budget_id, hours, date_of_usage)
select budget.id, FLOOR(RAND() * 10), CURRENT_DATE - INTERVAL FLOOR(RAND() * 365) DAY from budget
    join budget_type bt on bt.id = budget.budget_type_id
where bt.allow_time_balance;

insert into hours(budget_id, hours, date_of_usage)
select budget.id, FLOOR(RAND() * 10), CURRENT_DATE - INTERVAL FLOOR(RAND() * 365) DAY from budget
    join budget_type bt on bt.id = budget.budget_type_id
where bt.allow_time_balance;
