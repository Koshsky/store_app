-- Создание последовательностей
CREATE SEQUENCE IF NOT EXISTS expense_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS warehouses_id_seq;
CREATE SEQUENCE IF NOT EXISTS sales_id_seq;
CREATE SEQUENCE IF NOT EXISTS charges_id_seq;

-- Таблица статей расходов
CREATE TABLE IF NOT EXISTS expense_items (
    id integer NOT NULL DEFAULT nextval('expense_items_id_seq'::regclass),
    name character varying(100) NOT NULL,
    CONSTRAINT expense_items_pkey PRIMARY KEY (id)
);

-- Таблица товаров на складе
CREATE TABLE IF NOT EXISTS warehouses (
    id integer NOT NULL DEFAULT nextval('warehouses_id_seq'::regclass),
    name character varying(100) NOT NULL,
    quantity integer,
    amount numeric,
    CONSTRAINT warehouses_pkey PRIMARY KEY (id)
);

-- Таблица продаж
CREATE TABLE IF NOT EXISTS sales (
    id integer NOT NULL DEFAULT nextval('sales_id_seq'::regclass),
    amount numeric,
    quantity integer,
    sale_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    warehouse_id integer,
    CONSTRAINT sales_pkey PRIMARY KEY (id),
    CONSTRAINT sales_warehouse_id_fkey FOREIGN KEY (warehouse_id)
        REFERENCES warehouses (id) ON DELETE CASCADE
);

-- Таблица расходов
CREATE TABLE IF NOT EXISTS charges (
    id integer NOT NULL DEFAULT nextval('charges_id_seq'::regclass),
    amount numeric,
    charge_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expense_item_id integer,
    CONSTRAINT charges_pkey PRIMARY KEY (id),
    CONSTRAINT charges_expense_item_id_fkey FOREIGN KEY (expense_item_id)
        REFERENCES expense_items (id) ON DELETE CASCADE
);

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_sales_warehouse_id ON sales(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_charges_expense_item_id ON charges(expense_item_id);
CREATE INDEX IF NOT EXISTS idx_charges_charge_date ON charges(charge_date);
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);