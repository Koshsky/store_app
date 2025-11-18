-- Функция для проверки максимальной суммы расходов
CREATE OR REPLACE FUNCTION check_charge_amount()
RETURNS TRIGGER AS $$
DECLARE
    max_amount CONSTANT NUMERIC := 1000000;
BEGIN
    IF NEW.amount > max_amount THEN
        RAISE EXCEPTION 'Сумма расхода (%) превышает максимально допустимую сумму (%)', NEW.amount, max_amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для проверки суммы расходов
DROP TRIGGER IF EXISTS prevent_high_charge_amount ON charges;
CREATE TRIGGER prevent_high_charge_amount 
    BEFORE INSERT ON charges 
    FOR EACH ROW 
    EXECUTE FUNCTION check_charge_amount();

-- Функция для предотвращения изменения старых продаж
CREATE OR REPLACE FUNCTION prevent_backdated_sales_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sale_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Запрещено изменять данные о продажах задним числом. Исходная дата продажи: %. Текущая дата: %.', OLD.sale_date::DATE, CURRENT_DATE;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.sale_date IS DISTINCT FROM OLD.sale_date THEN
        IF NEW.sale_date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Запрещено устанавливать дату продажи задним числом. Новая дата: %. Текущая дата: %.', NEW.sale_date::DATE, CURRENT_DATE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для предотвращения изменения старых продаж
DROP TRIGGER IF EXISTS prevent_backdated_sales_updates ON sales;
CREATE TRIGGER prevent_backdated_sales_updates 
    BEFORE UPDATE ON sales 
    FOR EACH ROW 
    EXECUTE FUNCTION prevent_backdated_sales_changes();

-- Функция для предотвращения удаления старых расходов
CREATE OR REPLACE FUNCTION prevent_old_expenses_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.charge_date < (CURRENT_DATE - INTERVAL '1 month') THEN
        RAISE EXCEPTION 'Запрещено удалять расходы старше одного месяца';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Триггер для предотвращения удаления старых расходов
DROP TRIGGER IF EXISTS prevent_old_charges_deletion ON charges;
CREATE TRIGGER prevent_old_charges_deletion 
    BEFORE DELETE ON charges 
    FOR EACH ROW 
    EXECUTE FUNCTION prevent_old_expenses_deletion();

-- Функция для расчета налога
CREATE OR REPLACE FUNCTION calculate_tax(month_date date)
RETURNS numeric AS $$
DECLARE
    profit NUMERIC;
    tax_amount NUMERIC;
BEGIN
    SELECT COALESCE(SUM(s.amount * s.quantity), 0)
    INTO profit
    FROM sales s
    WHERE DATE_TRUNC('month', s.sale_date) = DATE_TRUNC('month', month_date - INTERVAL '1 month');
    
    tax_amount := GREATEST(profit * 0.15, 20000);
    RETURN tax_amount;
END;
$$ LANGUAGE plpgsql;

-- Функция для генерации случайной даты
CREATE OR REPLACE FUNCTION random_date_within_last_months(months integer)
RETURNS timestamp without time zone AS $$
BEGIN
    RETURN (CURRENT_DATE - (floor(random() * (months * 30)) || ' days')::INTERVAL) + (random() * INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;