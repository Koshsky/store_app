-- Удаление таблиц в правильном порядке (с учетом внешних ключей)
DROP TABLE IF EXISTS charges;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS expense_items;
DROP TABLE IF EXISTS warehouses;

-- Удаление последовательностей
DROP SEQUENCE IF EXISTS charges_id_seq;
DROP SEQUENCE IF EXISTS sales_id_seq;
DROP SEQUENCE IF EXISTS expense_items_id_seq;
DROP SEQUENCE IF EXISTS warehouses_id_seq;