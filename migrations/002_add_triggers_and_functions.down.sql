-- Удаление триггеров
DROP TRIGGER IF EXISTS prevent_high_charge_amount ON charges;
DROP TRIGGER IF EXISTS prevent_backdated_sales_updates ON sales;
DROP TRIGGER IF EXISTS prevent_old_charges_deletion ON charges;

-- Удаление функций
DROP FUNCTION IF EXISTS check_charge_amount();
DROP FUNCTION IF EXISTS prevent_backdated_sales_changes();
DROP FUNCTION IF EXISTS prevent_old_expenses_deletion();
DROP FUNCTION IF EXISTS calculate_tax(date);
DROP FUNCTION IF EXISTS random_date_within_last_months(integer);