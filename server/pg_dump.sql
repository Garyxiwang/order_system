--
-- PostgreSQL database dump
--

\restrict Se0L9hstfaNxwawZrtdbsLZurIuX3m2xwAdYW4myQEJohnODo6egYk6JZxUSikf

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: categorytype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categorytype AS ENUM (
    'INTERNAL_PRODUCTION',
    'EXTERNAL_PURCHASE'
);


--
-- Name: itemtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.itemtype AS ENUM (
    'INTERNAL',
    'EXTERNAL'
);


--
-- Name: userrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.userrole AS ENUM (
    'superAdmin',
    'manager',
    'auditor',
    'designer',
    'splitting',
    'clerk',
    'procurement',
    'salesperson',
    'finance',
    'workshop',
    'shipper'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category_type public.categorytype NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: COLUMN categories.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categories.name IS '类目名称';


--
-- Name: COLUMN categories.category_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categories.category_type IS '类目分类';


--
-- Name: COLUMN categories.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categories.created_at IS '创建时间';


--
-- Name: COLUMN categories.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categories.updated_at IS '更新时间';


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_name character varying(100) NOT NULL,
    address text NOT NULL,
    designer character varying(50),
    salesperson character varying(50),
    assignment_date character varying(50) NOT NULL,
    order_date character varying(50),
    category_name character varying(100) NOT NULL,
    order_type character varying(50) NOT NULL,
    cabinet_area numeric(10,2),
    wall_panel_area numeric(10,2),
    order_amount numeric(12,2),
    is_installation boolean,
    remarks text,
    order_status character varying(200),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN orders.order_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.order_number IS '订单编号';


--
-- Name: COLUMN orders.customer_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.customer_name IS '客户名称';


--
-- Name: COLUMN orders.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.address IS '地址';


--
-- Name: COLUMN orders.designer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.designer IS '设计师';


--
-- Name: COLUMN orders.salesperson; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.salesperson IS '销售员';


--
-- Name: COLUMN orders.assignment_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.assignment_date IS '分单日期';


--
-- Name: COLUMN orders.order_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.order_date IS '下单日期';


--
-- Name: COLUMN orders.category_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.category_name IS '类目名称';


--
-- Name: COLUMN orders.order_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.order_type IS '订单类型';


--
-- Name: COLUMN orders.cabinet_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.cabinet_area IS '柜体面积';


--
-- Name: COLUMN orders.wall_panel_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.wall_panel_area IS '墙板面积';


--
-- Name: COLUMN orders.order_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.order_amount IS '订单金额';


--
-- Name: COLUMN orders.is_installation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.is_installation IS '是否安装';


--
-- Name: COLUMN orders.remarks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.remarks IS '备注';


--
-- Name: COLUMN orders.order_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.order_status IS '订单状态';


--
-- Name: COLUMN orders.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.created_at IS '创建时间';


--
-- Name: COLUMN orders.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.updated_at IS '更新时间';


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: production_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_progress (
    id integer NOT NULL,
    production_id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    item_type public.itemtype NOT NULL,
    category_name character varying(100) NOT NULL,
    order_date character varying(50),
    expected_material_date character varying(50),
    actual_storage_date character varying(50),
    storage_time character varying(50),
    quantity character varying(20),
    expected_arrival_date character varying(50),
    actual_arrival_date character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN production_progress.production_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.production_id IS '生产管理ID';


--
-- Name: COLUMN production_progress.order_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.order_number IS '订单编号';


--
-- Name: COLUMN production_progress.item_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.item_type IS '项目类型';


--
-- Name: COLUMN production_progress.category_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.category_name IS '类目名称';


--
-- Name: COLUMN production_progress.order_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.order_date IS '下单日期（实际拆单日期）';


--
-- Name: COLUMN production_progress.expected_material_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.expected_material_date IS '预计齐料日期';


--
-- Name: COLUMN production_progress.actual_storage_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.actual_storage_date IS '实际入库日期';


--
-- Name: COLUMN production_progress.storage_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.storage_time IS '入库时间';


--
-- Name: COLUMN production_progress.quantity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.quantity IS '件数';


--
-- Name: COLUMN production_progress.expected_arrival_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.expected_arrival_date IS '预计到厂日期';


--
-- Name: COLUMN production_progress.actual_arrival_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.actual_arrival_date IS '实际到厂日期';


--
-- Name: COLUMN production_progress.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.created_at IS '创建时间';


--
-- Name: COLUMN production_progress.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.production_progress.updated_at IS '更新时间';


--
-- Name: production_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_progress_id_seq OWNED BY public.production_progress.id;


--
-- Name: productions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productions (
    id integer NOT NULL,
    order_id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_name character varying(100) NOT NULL,
    address character varying(200),
    splitter character varying(50),
    is_installation boolean,
    customer_payment_date character varying(50),
    split_order_date character varying(50),
    internal_production_items text,
    external_purchase_items text,
    order_days character varying(20),
    expected_delivery_date character varying(50),
    board_18 character varying(50),
    board_09 character varying(50),
    order_status character varying(20),
    actual_delivery_date character varying(50),
    cutting_date character varying(50),
    expected_shipping_date character varying(50),
    remarks text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN productions.order_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.order_id IS '关联订单ID';


--
-- Name: COLUMN productions.order_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.order_number IS '订单编号';


--
-- Name: COLUMN productions.customer_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.customer_name IS '客户名称';


--
-- Name: COLUMN productions.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.address IS '地址';


--
-- Name: COLUMN productions.splitter; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.splitter IS '拆单员';


--
-- Name: COLUMN productions.is_installation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.is_installation IS '是否安装';


--
-- Name: COLUMN productions.customer_payment_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.customer_payment_date IS '客户打款日期';


--
-- Name: COLUMN productions.split_order_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.split_order_date IS '拆单下单日期';


--
-- Name: COLUMN productions.internal_production_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.internal_production_items IS '厂内生产项';


--
-- Name: COLUMN productions.external_purchase_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.external_purchase_items IS '外购项';


--
-- Name: COLUMN productions.order_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.order_days IS '下单天数';


--
-- Name: COLUMN productions.expected_delivery_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.expected_delivery_date IS '预计交货日期';


--
-- Name: COLUMN productions.board_18; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.board_18 IS '18板';


--
-- Name: COLUMN productions.board_09; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.board_09 IS '09板';


--
-- Name: COLUMN productions.order_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.order_status IS '订单状态';


--
-- Name: COLUMN productions.actual_delivery_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.actual_delivery_date IS '实际出货日期';


--
-- Name: COLUMN productions.cutting_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.cutting_date IS '下料日期';


--
-- Name: COLUMN productions.expected_shipping_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.expected_shipping_date IS '预计出货日期';


--
-- Name: COLUMN productions.remarks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.remarks IS '备注';


--
-- Name: COLUMN productions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.created_at IS '创建时间';


--
-- Name: COLUMN productions.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.productions.updated_at IS '更新时间';


--
-- Name: productions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.productions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.productions_id_seq OWNED BY public.productions.id;


--
-- Name: progresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progresses (
    id integer NOT NULL,
    order_id integer NOT NULL,
    task_item character varying(200) NOT NULL,
    planned_date character varying(20) NOT NULL,
    actual_date character varying(20),
    remarks text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN progresses.order_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.order_id IS '订单ID';


--
-- Name: COLUMN progresses.task_item; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.task_item IS '进行事项';


--
-- Name: COLUMN progresses.planned_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.planned_date IS '计划日期';


--
-- Name: COLUMN progresses.actual_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.actual_date IS '实际日期';


--
-- Name: COLUMN progresses.remarks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.remarks IS '备注';


--
-- Name: COLUMN progresses.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.created_at IS '创建时间';


--
-- Name: COLUMN progresses.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progresses.updated_at IS '更新时间';


--
-- Name: progresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.progresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: progresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.progresses_id_seq OWNED BY public.progresses.id;


--
-- Name: split_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.split_progress (
    id integer NOT NULL,
    split_id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    item_type public.itemtype NOT NULL,
    category_name character varying(100) NOT NULL,
    planned_date character varying(50),
    split_date character varying(50),
    purchase_date character varying(50),
    cycle_days character varying(20),
    status character varying(20),
    remarks text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN split_progress.split_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.split_id IS '拆单ID';


--
-- Name: COLUMN split_progress.order_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.order_number IS '订单编号';


--
-- Name: COLUMN split_progress.item_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.item_type IS '项目类型';


--
-- Name: COLUMN split_progress.category_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.category_name IS '类目名称';


--
-- Name: COLUMN split_progress.planned_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.planned_date IS '计划日期';


--
-- Name: COLUMN split_progress.split_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.split_date IS '拆单日期（厂内项）';


--
-- Name: COLUMN split_progress.purchase_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.purchase_date IS '采购日期（外购项）';


--
-- Name: COLUMN split_progress.cycle_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.cycle_days IS '周期天数';


--
-- Name: COLUMN split_progress.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.status IS '状态';


--
-- Name: COLUMN split_progress.remarks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.remarks IS '备注';


--
-- Name: COLUMN split_progress.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.created_at IS '创建时间';


--
-- Name: COLUMN split_progress.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.split_progress.updated_at IS '更新时间';


--
-- Name: split_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.split_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: split_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.split_progress_id_seq OWNED BY public.split_progress.id;


--
-- Name: splits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.splits (
    id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_name character varying(100) NOT NULL,
    address text NOT NULL,
    order_date character varying(50),
    designer character varying(50),
    salesperson character varying(50),
    order_amount numeric(12,2),
    cabinet_area numeric(10,2),
    wall_panel_area numeric(10,2),
    order_type character varying(20) NOT NULL,
    order_status character varying(20) NOT NULL,
    splitter character varying(50),
    quote_status character varying(20),
    actual_payment_date character varying(50),
    completion_date character varying(50),
    remarks text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN splits.order_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.order_number IS '订单编号';


--
-- Name: COLUMN splits.customer_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.customer_name IS '客户名称';


--
-- Name: COLUMN splits.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.address IS '地址';


--
-- Name: COLUMN splits.order_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.order_date IS '下单日期';


--
-- Name: COLUMN splits.designer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.designer IS '设计师';


--
-- Name: COLUMN splits.salesperson; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.salesperson IS '销售员';


--
-- Name: COLUMN splits.order_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.order_amount IS '订单金额';


--
-- Name: COLUMN splits.cabinet_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.cabinet_area IS '柜体面积';


--
-- Name: COLUMN splits.wall_panel_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.wall_panel_area IS '墙板面积';


--
-- Name: COLUMN splits.order_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.order_type IS '订单类型';


--
-- Name: COLUMN splits.order_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.order_status IS '订单状态';


--
-- Name: COLUMN splits.splitter; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.splitter IS '拆单员';


--
-- Name: COLUMN splits.quote_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.quote_status IS '报价状态';


--
-- Name: COLUMN splits.actual_payment_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.actual_payment_date IS '实际打款日期';


--
-- Name: COLUMN splits.completion_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.completion_date IS '完成日期';


--
-- Name: COLUMN splits.remarks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.remarks IS '备注';


--
-- Name: COLUMN splits.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.created_at IS '创建时间';


--
-- Name: COLUMN splits.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.splits.updated_at IS '更新时间';


--
-- Name: splits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.splits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: splits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.splits_id_seq OWNED BY public.splits.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    role public.userrole NOT NULL,
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: COLUMN users.username; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.username IS '用户名';


--
-- Name: COLUMN users.password; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.password IS '密码哈希';


--
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.role IS '用户角色';


--
-- Name: COLUMN users.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.id IS '主键ID';


--
-- Name: COLUMN users.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.created_at IS '创建时间';


--
-- Name: COLUMN users.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.updated_at IS '更新时间';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: production_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_progress ALTER COLUMN id SET DEFAULT nextval('public.production_progress_id_seq'::regclass);


--
-- Name: productions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productions ALTER COLUMN id SET DEFAULT nextval('public.productions_id_seq'::regclass);


--
-- Name: progresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progresses ALTER COLUMN id SET DEFAULT nextval('public.progresses_id_seq'::regclass);


--
-- Name: split_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split_progress ALTER COLUMN id SET DEFAULT nextval('public.split_progress_id_seq'::regclass);


--
-- Name: splits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.splits ALTER COLUMN id SET DEFAULT nextval('public.splits_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES (2, '柜体', 'INTERNAL_PRODUCTION', '2025-10-11 08:14:55.729817+00', '2025-10-11 08:14:55.729817+00');
INSERT INTO public.categories VALUES (3, '木门', 'INTERNAL_PRODUCTION', '2025-10-11 08:15:02.164415+00', '2025-10-11 08:15:02.164415+00');
INSERT INTO public.categories VALUES (4, '单门板', 'INTERNAL_PRODUCTION', '2025-10-11 08:15:09.413458+00', '2025-10-11 08:15:09.413458+00');
INSERT INTO public.categories VALUES (5, '石材', 'EXTERNAL_PURCHASE', '2025-10-11 08:15:16.607111+00', '2025-10-11 08:15:16.607111+00');
INSERT INTO public.categories VALUES (6, '钛镁合金门', 'EXTERNAL_PURCHASE', '2025-10-11 08:15:24.847233+00', '2025-10-11 08:15:24.847233+00');
INSERT INTO public.categories VALUES (8, '铝板类', 'EXTERNAL_PURCHASE', '2025-10-11 08:15:47.3184+00', '2025-10-11 08:15:47.3184+00');


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders VALUES (9, 'G250819-01', '三原郝总-雁熙云著·澜庭2号楼3201', '西安', '段增辉', '杨宇', '2025-08-18', NULL, '柜体', '设计单', 44.00, 1.14, 32807.00, true, '', '报价', '2025-10-12 02:11:25.251628', '2025-10-12 02:16:34.950078');
INSERT INTO public.orders VALUES (17, 'G250727-04', '西安钻石店-兴荣苑1-1-3002', '西安', '杨哲', '李云', '2025-08-01', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '报价', '2025-10-12 05:20:19.711889', '2025-10-13 01:01:25.354489');
INSERT INTO public.orders VALUES (25, 'G250515-01', '西安钻石店-保利天悦2-2102', '西安', '杨哲', '李云', '2025-09-10', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '改图', '2025-10-12 07:21:53.915233', '2025-10-13 01:00:29.57607');
INSERT INTO public.orders VALUES (19, 'G250723-03', '雅丽家赵总-融创御河宸院9-1-2401', '彬州', '杨哲', '杨宇', '2025-07-24', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '暂停', '2025-10-12 06:57:39.821259', '2025-10-13 01:01:42.5307');
INSERT INTO public.orders VALUES (10, 'G250903-04', '散户-曲江大城16号楼802', '西安', '段增辉', '杨宇', '2025-09-01', NULL, '铝板类,木门,柜体,石材', '设计单', 46.38, 124.78, NULL, true, '', '报价', '2025-10-12 02:30:50.152408', '2025-10-12 02:37:37.377912');
INSERT INTO public.orders VALUES (26, 'G250915-01', '澄县安家-公园天下10-1303', '澄县', '景兵霖', '杨宇', '2025-09-16', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '客户确认图', '2025-10-12 07:22:39.919185', '2025-10-12 07:25:57.361544');
INSERT INTO public.orders VALUES (29, 'G250930-01', '合阳王-高新·枫叶新都市嵘园C4-1-401', '西安', '景兵霖', '杨宇', '2025-09-30', NULL, '柜体,木门', '设计单', 54.20, 21.73, 61425.00, false, '', '复尺', '2025-10-12 07:35:33.009078', '2025-10-13 00:52:04.619261');
INSERT INTO public.orders VALUES (7, 'G250721-01', '商洛付总-惠达广场9-3005', '商洛', '段增辉', '杨宇', '2025-07-21', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '暂停', '2025-10-12 02:02:51.318415', '2025-10-13 00:45:19.463772');
INSERT INTO public.orders VALUES (23, 'G250907-03', '县嘉宁-飞天公寓', '天水', '景兵霖', '杨宇', '2025-09-07', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '暂停', '2025-10-12 07:19:27.94499', '2025-10-13 00:53:13.526627');
INSERT INTO public.orders VALUES (1, 'G250214-04', '西安钻石店-高芯悦澜', '西安', '段增辉', '李云', '2025-02-14', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 01:15:56.062985', '2025-10-12 01:50:12.046753');
INSERT INTO public.orders VALUES (22, 'G250902-03', '西安钻石店-世园悦府A座1208室', '西安', '景兵霖', '李云', '2025-09-03', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '改图', '2025-10-12 07:12:02.834019', '2025-10-12 07:16:54.208421');
INSERT INTO public.orders VALUES (2, 'G250415-04', '西安钻石店-华清学府城27F-3-902', '西安', '段增辉', '李云', '2025-04-15', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '报价', '2025-10-12 01:27:56.17906', '2025-10-12 01:51:33.414197');
INSERT INTO public.orders VALUES (3, 'G250425-04', '贾师傅-华清学府幸福印四期73-1-1501', '西安', '段增辉', '杨宇', '2025-05-04', NULL, '柜体', '设计单', 53.00, 11.59, 36500.00, false, '', '下单', '2025-10-12 01:38:36.18514', '2025-10-12 01:51:51.381933');
INSERT INTO public.orders VALUES (4, 'GB241005-04', '贾师傅-恒大文化旅游城13-1-2103增补', '咸阳', '段增辉', '杨宇', '2025-05-22', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '客户硬装阶段', '2025-10-12 01:48:46.537234', '2025-10-12 01:52:16.370906');
INSERT INTO public.orders VALUES (11, 'G250907-01', '西安钻石店-港悦城悦颂11-2-1402', '西安', '段增辉', '李云', '2025-09-08', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '等交房', '2025-10-12 02:39:30.226322', '2025-10-13 00:40:05.173135');
INSERT INTO public.orders VALUES (5, 'G250526-02', '陈总-万科东望上郡2-1-1202', '西安', '段增辉', '杨博', '2025-05-26', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '客户硬装阶段', '2025-10-12 01:54:31.289088', '2025-10-12 01:57:25.437999');
INSERT INTO public.orders VALUES (37, 'G250711-03', '西安钻石店-龙湖云璟2号楼11606房', '西安', '景兵霖', '李云', '2025-10-11', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '初稿', '2025-10-12 07:46:36.440372', '2025-10-13 00:48:39.418806');
INSERT INTO public.orders VALUES (6, 'G250605-03', '西安钻石店-粼云天序5-1001', '西安', '段增辉', '李云', '2025-06-05', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 01:58:46.597038', '2025-10-12 02:01:25.698954');
INSERT INTO public.orders VALUES (13, 'G250621-01', '西安钻石店-高总高新云河颂', '西安', '段增辉', '李佳颖', '2025-09-15', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '初稿', '2025-10-12 03:15:08.679938', '2025-10-13 00:47:19.081793');
INSERT INTO public.orders VALUES (8, 'G250721-02', '商洛付总-惠达广场9-3102', '商洛', '段增辉', '杨宇', '2025-07-21', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '报价', '2025-10-12 02:04:50.292779', '2025-10-12 02:08:29.535867');
INSERT INTO public.orders VALUES (42, 'G250407-03', '孟总-润玺台2-1-502', '西安', '杨哲', '李云', '2025-04-07', NULL, '柜体,木门', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 08:39:42.891262', '2025-10-13 01:02:17.093106');
INSERT INTO public.orders VALUES (12, 'G250906-04', '西派樘樾9-1602', '西安', '段增辉', '杨宇', '2025-09-12', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '打款', '2025-10-12 03:05:50.265979', '2025-10-13 00:39:13.203261');
INSERT INTO public.orders VALUES (14, 'G251004-01', '西安钻石店-中宝达理想时光2-2-3201', '西安', '段增辉', '李云', '2025-10-04', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 03:35:59.347437', '2025-10-13 00:37:43.359073');
INSERT INTO public.orders VALUES (16, 'G251009-03', '三原郝总-水韵池阳14-1-10012', '三原', '段增辉', '杨博', '2025-10-10', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '量尺', '2025-10-12 03:39:27.954665', '2025-10-12 03:39:47.13121');
INSERT INTO public.orders VALUES (18, 'G250720-02', '西安钻石店-东城御府6-2-1502', '旬邑', '杨哲', '李云', '2025-08-02', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '量尺', '2025-10-12 05:26:47.166449', '2025-10-12 07:19:55.861622');
INSERT INTO public.orders VALUES (24, 'GB250724-01', '县嘉宁-盛达公馆3-3-402增补', '天水', '景兵霖', '杨宇', '2025-09-12', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '客户确认图', '2025-10-12 07:20:48.477026', '2025-10-12 07:21:14.120996');
INSERT INTO public.orders VALUES (20, 'G250731-02', '师总-中南菩悦东望城3-1-3104', '西安', '景兵霖', '杨宇', '2025-07-31', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '等客户确认颜色', '2025-10-12 07:02:23.213742', '2025-10-12 07:06:35.213864');
INSERT INTO public.orders VALUES (34, 'G250723-02', '散户-樊家村自建别墅石磊峰', '富平', '景兵霖', '杨宇', '2025-10-09', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '进行中', '2025-10-12 07:44:44.253804', '2025-10-12 07:44:44.253808');
INSERT INTO public.orders VALUES (36, 'G250927-04', '富平方涛-北屯安置房', '阎良', '杨哲', '杨宇', '2025-09-30', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '出内部结构图', '2025-10-12 07:45:37.729513', '2025-10-13 00:57:16.461986');
INSERT INTO public.orders VALUES (28, 'G250919-02', '三原郝总-雁熙云著·铂萃4-2-3201', '西安', '景兵霖', '杨博', '2025-09-21', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '暂停', '2025-10-12 07:26:46.212229', '2025-10-12 07:28:37.997774');
INSERT INTO public.orders VALUES (30, 'G250930-02', '韩城刘总-盘乐金地4-东-4楼东户', '韩城', '景兵霖', '杨宇', '2025-09-30', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '客户确认图', '2025-10-12 07:38:15.255525', '2025-10-12 07:39:27.538032');
INSERT INTO public.orders VALUES (27, 'G250922-01', '西安钻石店-雍照华庭11-2-901', '铜川', '杨哲', '李云', '2025-09-23', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '报价', '2025-10-12 07:25:03.361087', '2025-10-13 00:59:33.912842');
INSERT INTO public.orders VALUES (38, 'G250503-03', '西安钻石店-汉湖丽都1-2-2904', '西安', '高永辉', '李云', '2025-05-22', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '报价', '2025-10-12 08:25:14.171873', '2025-10-12 08:26:48.141713');
INSERT INTO public.orders VALUES (32, 'G250925-01', '散户-太奥广场住宅北区4-2-2903', '西安', '杨哲', '杨宇', '2025-09-26', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 07:42:10.461465', '2025-10-13 00:57:47.124262');
INSERT INTO public.orders VALUES (35, 'G251009-01', '姜总-西西安小镇19-2-202', '西安', '景兵霖', '李云', '2025-10-09', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '初稿', '2025-10-12 07:45:32.016599', '2025-10-12 07:45:59.26415');
INSERT INTO public.orders VALUES (40, 'G250719-01', '商洛付总-天辰2-1-902', '商洛', '高永辉', '杨宇', '2025-07-19', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '客户硬装阶段', '2025-10-12 08:32:55.969075', '2025-10-12 08:35:10.966581');
INSERT INTO public.orders VALUES (33, 'G251007-01', '顺天整装-百盛家园', '合阳', '景兵霖', '杨宇', '2025-10-07', NULL, '柜体', '设计单', 4.57, 0.00, 2512.00, false, '', '打款', '2025-10-12 07:43:06.356722', '2025-10-13 00:49:55.479405');
INSERT INTO public.orders VALUES (39, 'G250609-03', '商洛付总-镇安李总自建房', '商洛', '高永辉', '杨宇', '2025-06-09', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '报价', '2025-10-12 08:27:38.783899', '2025-10-12 08:32:11.384759');
INSERT INTO public.orders VALUES (41, 'G250713-01', '杨宇散户-陕建御湖小区10号楼404', '铜川', '高永辉', '杨宇', '2025-07-26', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 08:36:06.23244', '2025-10-12 08:38:54.445796');
INSERT INTO public.orders VALUES (31, 'G251004-04', '西安钻石店-中南青樾北区11-504', '西安', '景兵霖', '李云', '2025-10-04', '2025-10-13', '柜体,石材', '设计单', NULL, NULL, NULL, true, '', '已下单', '2025-10-12 07:40:25.909043', '2025-10-14 01:35:44.580428');
INSERT INTO public.orders VALUES (43, 'G250816-02', '西安钻石店-展厅', '西安', '高永辉', '李云', '2025-08-16', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户确认图', '2025-10-12 08:39:51.814823', '2025-10-12 08:43:24.771311');
INSERT INTO public.orders VALUES (44, 'G250824-02', '西安钻石店-启迪大院3-3102', '西安', '高永辉', '李佳颖', '2025-08-24', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '改水电', '2025-10-12 08:44:29.784441', '2025-10-12 08:45:53.943567');
INSERT INTO public.orders VALUES (15, 'G251009-02', '西安钻石店-锦悦二府5-1-801', '西安', '段增辉', '李云', '2025-10-09', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '初稿', '2025-10-12 03:38:00.027714', '2025-10-13 00:35:54.848536');
INSERT INTO public.orders VALUES (21, 'G250903-01', '阎良郭总-洺悦府10-1-802', '阎良', '景兵霖', '杨宇', '2025-09-02', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '打款', '2025-10-12 07:08:12.270106', '2025-10-13 00:53:54.413925');
INSERT INTO public.orders VALUES (52, 'G250702-04', '锦天城5-1702', '榆林', '杨宇涛', '李云', '2025-08-21', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '进行中', '2025-10-12 09:10:11.874484', '2025-10-12 09:10:11.874488');
INSERT INTO public.orders VALUES (56, 'G250318-02', '马艳-文苑公寓5-2-301', '咸阳', '杨宇涛', '李云', '2025-09-27', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '进行中', '2025-10-12 09:15:18.303006', '2025-10-12 09:15:18.303009');
INSERT INTO public.orders VALUES (70, '测试1', '测试1', '测试1', NULL, '高莎', '2025-10-13', NULL, '木门,柜体,石材,钛镁合金门', '生产单', 50.00, 10.00, 10000.00, true, '', '已下单', '2025-10-13 07:59:38.469214', '2025-10-13 08:00:40.728386');
INSERT INTO public.orders VALUES (66, 'G250928-01', '黄陵王总-铁筹小区1-1-103', '黄陵', '杨宇涛', '杨宇', '2025-09-28', '2025-10-13', '柜体', '设计单', 1.87, 0.00, 572.00, false, '', '已下单', '2025-10-13 06:10:41.02213', '2025-10-13 08:19:23.439361');
INSERT INTO public.orders VALUES (51, 'G250927-03', '西安钻石店-尚品美地城西区8-1-702', '西安', '高永辉', '李佳颖', '2025-09-27', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '改图', '2025-10-12 09:08:38.724253', '2025-10-14 00:33:31.497952');
INSERT INTO public.orders VALUES (57, 'G251004-02', '贾师傅-灵台县水岸学府1号楼二单元4102', '甘肃', '杨宇涛', '杨宇', '2025-10-12', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '打款', '2025-10-12 09:15:51.532549', '2025-10-12 09:58:06.088538');
INSERT INTO public.orders VALUES (47, 'G250830-03', '西安钻石店-龙湖上城11-1006', '西安', '高永辉', '李云', '2025-08-29', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '下单', '2025-10-12 08:52:53.906985', '2025-10-12 08:57:17.436373');
INSERT INTO public.orders VALUES (64, 'G250804-03', '张军正-华荣商城自建房', '铜川', '杨哲', '姜恩梦', '2025-08-04', '2025-10-13', '柜体,木门,钛镁合金门', '设计单', 63.85, 0.00, 121500.00, true, '', '已下单', '2025-10-13 06:01:30.670382', '2025-10-13 06:03:44.207956');
INSERT INTO public.orders VALUES (50, 'G250920-02', '西安钻石店-蓝光公园华府一期9-3-102', '西安', '高永辉', '李云', '2025-09-20', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '公司对方案', '2025-10-12 09:06:40.08205', '2025-10-14 00:34:07.890126');
INSERT INTO public.orders VALUES (65, 'G250901-02', '鲁总-檀府二期2-801', '铜川', '景兵霖', '杨博', '2025-09-01', '2025-10-13', '柜体', '设计单', NULL, NULL, NULL, false, '', '已下单', '2025-10-13 06:07:21.746268', '2025-10-13 06:08:15.844807');
INSERT INTO public.orders VALUES (48, 'G250902-02', '西安钻石店-梅乐园3号楼2单元', '西安', '高永辉', '李云', '2025-09-03', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '客户硬装阶段', '2025-10-12 08:58:06.569833', '2025-10-12 09:01:45.970362');
INSERT INTO public.orders VALUES (59, 'G251006-04', '西安安荃宅配-华耀城9-1-601', '华阴', NULL, '杨博', '2025-10-06', '2025-10-12', '柜体', '生产单', NULL, NULL, NULL, false, '', '已下单', '2025-10-12 09:35:13.557751', '2025-10-12 10:02:39.666067');
INSERT INTO public.orders VALUES (60, 'G250830-01', '散户-颐和府1-3201', '西安', '段增辉', '杨宇', '2025-08-30', '2025-10-12', '柜体,木门,铝板类,钛镁合金门,石材', '设计单', 55.00, 2.84, 194809.00, true, '', '已下单', '2025-10-12 09:40:15.593211', '2025-10-12 10:03:00.58487');
INSERT INTO public.orders VALUES (49, 'G250913-01', '樊总-恒泰新家园2-2-1404', '西安', '高永辉', '杨宇', '2025-09-12', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '等客户打款', '2025-10-12 09:02:45.321065', '2025-10-12 09:05:44.170579');
INSERT INTO public.orders VALUES (61, 'G250809-01', '散户-融创望江府 DK2 20号楼 2单元 1601', '西安', '段增辉', '杨宇', '2025-10-12', '2025-10-12', '柜体,木门,铝板类,石材', '设计单', 65.90, 48.50, 140529.00, true, '', '已下单', '2025-10-12 09:54:08.274967', '2025-10-12 10:03:31.022381');
INSERT INTO public.orders VALUES (58, 'G250628-02', '西安钻石店-龙湖星河学樘府4-1-2601', '西安', '高永辉', '李云', '2025-06-28', '2025-10-12', '柜体,木门,钛镁合金门', '设计单', 58.94, 30.10, 118000.00, true, '', '已下单', '2025-10-12 09:24:11.044041', '2025-10-12 10:03:58.46808');
INSERT INTO public.orders VALUES (46, 'G250828-01', '西安钻石店-西派樘樾20-1302', '西安', '高永辉', '李佳颖', '2025-08-28', NULL, '柜体', '设计单', NULL, NULL, NULL, true, '', '复尺', '2025-10-12 08:47:06.616952', '2025-10-14 00:35:46.339696');
INSERT INTO public.orders VALUES (45, 'G251004-03', '商洛付总-农村自建房', '商洛', '杨哲', '杨宇', '2025-10-05', NULL, '柜体,木门,钛镁合金门', '生产单', NULL, NULL, NULL, false, '', '报价', '2025-10-12 08:47:02.28784', '2025-10-13 01:03:51.177621');
INSERT INTO public.orders VALUES (71, 'G251013-03', '绿色家-和府小区6-12楼', '白水', NULL, '杨宇', '2025-10-13', NULL, '柜体', '生产单', NULL, NULL, NULL, false, '', '已下单', '2025-10-14 01:33:26.69519', '2025-10-14 01:33:49.563766');
INSERT INTO public.orders VALUES (63, 'G250929-02', 'KK美学-西安鼎城悦玺5-2302', '西安', NULL, '杨博', '2025-09-29', NULL, '柜体', '生产单', 23.52, 0.00, 8680.00, false, '', '已下单', '2025-10-13 05:48:16.308959', '2025-10-13 05:49:22.228647');
INSERT INTO public.orders VALUES (62, 'G250929-01', '渭南楷模高定-信达汣溪17-2-1502', '渭南', NULL, '杨宇', '2025-09-29', NULL, '柜体', '生产单', 13.53, 0.00, 5185.00, false, '', '已下单', '2025-10-13 05:46:42.569329', '2025-10-13 05:51:20.856732');
INSERT INTO public.orders VALUES (67, 'G251006-03', '斯瑞新材料科技产业园定制柜子', '西安', '陈朝西', '李云', '2025-10-06', '2025-10-13', '柜体,石材,铝板类', '设计单', 213.00, 0.00, 224800.00, true, '', '已下单', '2025-10-13 06:23:07.02213', '2025-10-13 06:24:51.217664');
INSERT INTO public.orders VALUES (68, 'G251013-01', '顺天整装-九龙印雷女士', '合阳', '景兵霖', '杨宇', '2025-10-13', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '进行中', '2025-10-13 06:39:27.075463', '2025-10-13 06:39:27.075466');
INSERT INTO public.orders VALUES (53, 'G250924-01', '高小平-东山育才路', '榆林', '杨宇涛', '李云', '2025-09-24', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '打款', '2025-10-12 09:10:47.52963', '2025-10-14 01:45:12.090206');
INSERT INTO public.orders VALUES (69, '测试', '测试', '在', NULL, '高莎', '2025-10-13', '2025-10-13', '柜体,石材,木门', '设计单', 50.00, 10.00, 20000.00, true, '', '已下单', '2025-10-13 07:44:23.263799', '2025-10-13 07:58:09.678699');
INSERT INTO public.orders VALUES (54, 'G250927-01', '贾师傅-恒泰新家园4-1-2304', '咸阳', '杨宇涛', '杨宇', '2025-09-27', NULL, '柜体', '设计单', NULL, NULL, NULL, false, '', '打款', '2025-10-12 09:11:42.322807', '2025-10-14 01:59:01.791984');
INSERT INTO public.orders VALUES (55, 'G251006-05', '贾师傅-恒泰新家园4-1-404', '咸阳', '杨宇涛', '杨宇', '2025-09-27', NULL, '柜体', '设计单', 39.87, 1.52, 19010.00, false, '', '打款', '2025-10-12 09:12:58.8219', '2025-10-14 02:00:08.913385');


--
-- Data for Name: production_progress; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.production_progress VALUES (7, 3, '测试', 'EXTERNAL', '石材', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 07:47:18.101122', '2025-10-13 07:47:18.101124');
INSERT INTO public.production_progress VALUES (9, 3, '测试', 'INTERNAL', '五金', '2025-10-13', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 07:47:18.101125', '2025-10-13 07:47:18.101126');
INSERT INTO public.production_progress VALUES (8, 3, '测试', 'INTERNAL', '柜体', '2025-10-13', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 07:47:18.101124', '2025-10-13 07:58:37.515206');
INSERT INTO public.production_progress VALUES (12, 4, '测试1', 'EXTERNAL', '石材', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 08:00:42.499875', '2025-10-13 08:00:42.499875');
INSERT INTO public.production_progress VALUES (13, 4, '测试1', 'EXTERNAL', '钛镁合金门', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 08:00:42.499876', '2025-10-13 08:00:42.499876');
INSERT INTO public.production_progress VALUES (14, 4, '测试1', 'INTERNAL', '五金', '2025-10-13', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 08:00:42.499876', '2025-10-13 08:00:42.499877');
INSERT INTO public.production_progress VALUES (10, 4, '测试1', 'INTERNAL', '木门', '2025-10-16', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 08:00:42.499871', '2025-10-13 08:02:23.964161');
INSERT INTO public.production_progress VALUES (11, 4, '测试1', 'INTERNAL', '柜体', '2025-10-13', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 08:00:42.499874', '2025-10-13 08:02:23.965242');
INSERT INTO public.production_progress VALUES (15, 5, 'G250928-01', 'INTERNAL', '柜体', '2025-10-11', '2025-10-18', '', NULL, NULL, NULL, NULL, '2025-10-13 08:19:26.142517', '2025-10-14 02:34:58.555394');
INSERT INTO public.production_progress VALUES (16, 5, 'G250928-01', 'INTERNAL', '五金', '2025-10-13', '2025-10-18', '', NULL, NULL, NULL, NULL, '2025-10-13 08:19:26.14252', '2025-10-14 02:34:58.555396');
INSERT INTO public.production_progress VALUES (5, 2, 'G250929-02', 'INTERNAL', '柜体', '2025-10-13', '2025-10-22', '', NULL, NULL, NULL, NULL, '2025-10-13 06:29:40.540209', '2025-10-14 02:35:58.195941');
INSERT INTO public.production_progress VALUES (6, 2, 'G250929-02', 'INTERNAL', '五金', '2025-10-13', '', '2025-10-14', NULL, NULL, NULL, NULL, '2025-10-13 06:29:40.540211', '2025-10-14 02:35:58.195943');
INSERT INTO public.production_progress VALUES (1, 1, 'G251006-03', 'INTERNAL', '柜体', '2025-10-09', '2025-10-22', '2025-10-14', NULL, NULL, NULL, NULL, '2025-10-13 06:27:03.995975', '2025-10-14 03:54:04.522988');
INSERT INTO public.production_progress VALUES (2, 1, 'G251006-03', 'EXTERNAL', '石材', '2025-10-13', NULL, NULL, NULL, NULL, '', '', '2025-10-13 06:27:03.995978', '2025-10-14 03:54:04.523911');
INSERT INTO public.production_progress VALUES (3, 1, 'G251006-03', 'EXTERNAL', '铝板类', '', NULL, NULL, NULL, NULL, '', '', '2025-10-13 06:27:03.995979', '2025-10-14 03:54:04.523913');
INSERT INTO public.production_progress VALUES (4, 1, 'G251006-03', 'INTERNAL', '五金', '2025-10-13', '2025-10-14', '2025-10-14', NULL, NULL, NULL, NULL, '2025-10-13 06:27:03.99598', '2025-10-14 03:54:04.524822');


--
-- Data for Name: productions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.productions VALUES (2, 63, 'G250929-02', 'KK美学-西安鼎城悦玺5-2302', '西安', '李圆圆', false, '2025-10-13', '2025-10-13', '柜体', '', '0', '2025-11-02', '', '', '未齐料', NULL, NULL, NULL, '', '2025-10-13 06:29:40.537591', '2025-10-13 06:29:40.537593');
INSERT INTO public.productions VALUES (3, 69, '测试', '测试', '在', '李圆圆', true, '2025-10-13', '2025-10-13', '柜体', '石材', '0', '2025-11-02', '', '', '未齐料', NULL, NULL, NULL, '', '2025-10-13 07:47:18.098439', '2025-10-13 07:47:18.098442');
INSERT INTO public.productions VALUES (4, 70, '测试1', '测试1', '测试1', '李圆圆', true, '2025-10-13', '2025-10-13', '木门,柜体', '石材,钛镁合金门', '0', '2025-11-02', '', '', '未齐料', NULL, NULL, NULL, '', '2025-10-13 08:00:42.496986', '2025-10-13 08:00:42.496988');
INSERT INTO public.productions VALUES (5, 66, 'G250928-01', '黄陵王总-铁筹小区1-1-103', '黄陵', '李圆圆', false, '2025-10-13', '2025-10-13', '柜体', '', '0', '2025-11-02', '', '', '未齐料', NULL, NULL, NULL, '', '2025-10-13 08:19:26.139762', '2025-10-13 08:19:26.139764');
INSERT INTO public.productions VALUES (1, 67, 'G251006-03', '斯瑞新材料科技产业园定制柜子', '西安', '李圆圆', true, '2025-10-06', '2025-10-13', '柜体', '石材,铝板类', '7', '2025-10-26', '', '', '已齐料', NULL, NULL, NULL, '', '2025-10-13 06:27:03.991268', '2025-10-14 03:54:04.519853');


--
-- Data for Name: progresses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.progresses VALUES (1, 1, '初稿', '2025-02-17', '2025-02-17', '', '2025-10-12 01:16:26.705427', '2025-10-12 01:16:39.723795');
INSERT INTO public.progresses VALUES (2, 1, '客户硬装阶段', '2025-10-31', NULL, '', '2025-10-12 01:17:16.21825', '2025-10-12 01:17:16.218253');
INSERT INTO public.progresses VALUES (3, 2, '量尺', '2025-04-17', '2025-04-17', '', '2025-10-12 01:28:12.504959', '2025-10-12 01:28:22.155061');
INSERT INTO public.progresses VALUES (4, 2, '初稿', '2025-05-17', '2025-05-17', '', '2025-10-12 01:28:54.02354', '2025-10-12 01:29:02.536144');
INSERT INTO public.progresses VALUES (5, 2, '改图', '2025-06-01', '2025-06-01', '', '2025-10-12 01:29:25.316877', '2025-10-12 01:29:33.368768');
INSERT INTO public.progresses VALUES (6, 2, '复尺', '2025-07-10', '2025-07-10', '', '2025-10-12 01:29:54.380513', '2025-10-12 01:30:07.07114');
INSERT INTO public.progresses VALUES (7, 2, '公司对方案', '2025-09-15', '2025-09-15', '', '2025-10-12 01:30:31.163423', '2025-10-12 01:30:40.764375');
INSERT INTO public.progresses VALUES (8, 2, '改图', '2025-09-21', '2025-09-21', '', '2025-10-12 01:31:02.576171', '2025-10-12 01:31:16.737713');
INSERT INTO public.progresses VALUES (9, 2, '报价', '2025-09-17', '2025-09-17', '已报价先暂停', '2025-10-12 01:32:55.816486', '2025-10-12 01:33:04.476046');
INSERT INTO public.progresses VALUES (10, 3, '初稿', '2025-05-08', '2025-05-08', '', '2025-10-12 01:39:13.65576', '2025-10-12 01:39:47.068239');
INSERT INTO public.progresses VALUES (11, 3, '改图', '2025-05-25', '2025-05-25', '', '2025-10-12 01:40:00.467049', '2025-10-12 01:40:08.386305');
INSERT INTO public.progresses VALUES (44, 12, '复尺', '2025-09-15', '2025-09-18', '复尺出报价', '2025-10-12 03:06:07.199078', '2025-10-12 03:06:25.830673');
INSERT INTO public.progresses VALUES (13, 3, '改图', '2025-09-28', '2025-09-28', '', '2025-10-12 01:41:01.935784', '2025-10-12 01:41:09.191227');
INSERT INTO public.progresses VALUES (12, 3, '改图', '2025-09-13', '2025-09-13', '', '2025-10-12 01:40:31.950541', '2025-10-12 01:41:21.743449');
INSERT INTO public.progresses VALUES (14, 3, '报价', '2025-09-17', '2025-09-18', '', '2025-10-12 01:42:22.509024', '2025-10-12 01:42:31.485321');
INSERT INTO public.progresses VALUES (15, 3, '打款', '2025-09-17', '2025-10-10', '', '2025-10-12 01:42:48.317359', '2025-10-12 01:43:35.819916');
INSERT INTO public.progresses VALUES (16, 3, '下单', '2025-10-11', NULL, '', '2025-10-12 01:43:52.650158', '2025-10-12 01:43:52.650161');
INSERT INTO public.progresses VALUES (17, 4, '客户硬装阶段', '2025-05-22', NULL, '', '2025-10-12 01:49:41.263043', '2025-10-12 01:49:41.263045');
INSERT INTO public.progresses VALUES (18, 5, '初稿', '2025-06-03', '2025-06-03', '出CAD', '2025-10-12 01:55:11.667627', '2025-10-12 01:56:10.122976');
INSERT INTO public.progresses VALUES (19, 5, '报价', '2025-06-05', '2025-06-05', '预报价', '2025-10-12 01:55:39.638943', '2025-10-12 01:56:20.475222');
INSERT INTO public.progresses VALUES (20, 5, '复尺', '2025-08-18', '2025-08-08', '', '2025-10-12 01:55:59.119665', '2025-10-12 01:57:08.619043');
INSERT INTO public.progresses VALUES (21, 5, '客户硬装阶段', '2025-08-18', NULL, '', '2025-10-12 01:57:25.438899', '2025-10-12 01:57:25.438903');
INSERT INTO public.progresses VALUES (22, 6, '量尺', '2025-06-28', '2025-06-28', '', '2025-10-12 02:00:08.173502', '2025-10-12 02:00:38.985467');
INSERT INTO public.progresses VALUES (23, 6, '公司对方案', '2025-09-09', '2025-09-09', '', '2025-10-12 02:01:01.688787', '2025-10-12 02:01:11.36373');
INSERT INTO public.progresses VALUES (24, 6, '客户硬装阶段', '2025-09-03', NULL, '', '2025-10-12 02:01:25.699846', '2025-10-12 02:01:25.699848');
INSERT INTO public.progresses VALUES (25, 7, '业主不在  暂定', '2025-07-21', NULL, '', '2025-10-12 02:03:44.735912', '2025-10-12 02:03:44.735915');
INSERT INTO public.progresses VALUES (26, 8, '量尺', '2025-07-21', '2025-07-21', '', '2025-10-12 02:05:39.631385', '2025-10-12 02:05:48.78572');
INSERT INTO public.progresses VALUES (27, 8, '初稿', '2025-07-26', '2025-07-26', '', '2025-10-12 02:06:52.185469', '2025-10-12 02:07:01.004907');
INSERT INTO public.progresses VALUES (28, 8, '改图', '2025-07-29', '2025-07-29', '', '2025-10-12 02:07:38.167495', '2025-10-12 02:07:50.326592');
INSERT INTO public.progresses VALUES (29, 8, '报价', '2025-10-06', '2025-10-06', '等客户确认报价', '2025-10-12 02:08:29.536934', '2025-10-12 02:08:35.7476');
INSERT INTO public.progresses VALUES (30, 9, '量尺', '2025-08-19', '2025-08-19', '', '2025-10-12 02:12:35.296025', '2025-10-12 02:12:45.912689');
INSERT INTO public.progresses VALUES (31, 9, '初稿', '2025-08-27', '2025-08-28', '', '2025-10-12 02:13:07.290595', '2025-10-12 02:13:25.085687');
INSERT INTO public.progresses VALUES (45, 12, '初稿', '2025-09-11', '2025-09-11', '', '2025-10-12 03:07:10.370176', '2025-10-12 03:07:18.655014');
INSERT INTO public.progresses VALUES (32, 9, '报价', '2025-09-12', '2025-09-12', '', '2025-10-12 02:16:34.951385', '2025-10-12 02:17:21.680881');
INSERT INTO public.progresses VALUES (33, 10, '量尺', '2025-09-03', '2025-10-03', '', '2025-10-12 02:35:45.876152', '2025-10-12 02:35:52.826349');
INSERT INTO public.progresses VALUES (35, 10, '公司对方案', '2025-09-04', '2025-09-04', '', '2025-10-12 02:36:26.211682', '2025-10-12 02:36:31.869472');
INSERT INTO public.progresses VALUES (34, 10, '报价', '2025-09-03', '2025-10-03', '预报价', '2025-10-12 02:36:14.127756', '2025-10-12 02:36:36.336889');
INSERT INTO public.progresses VALUES (36, 10, '公司对方案', '2025-09-28', '2025-09-28', '客户来公司对颜色', '2025-10-12 02:37:03.782318', '2025-10-12 02:37:11.56486');
INSERT INTO public.progresses VALUES (37, 10, '报价', '2025-10-07', '2025-10-07', '重新报价', '2025-10-12 02:37:37.378792', '2025-10-12 02:37:43.909722');
INSERT INTO public.progresses VALUES (38, 10, '报价', '2025-10-11', '2025-10-11', '修改报价', '2025-10-12 02:38:15.778711', '2025-10-12 02:38:22.843273');
INSERT INTO public.progresses VALUES (39, 11, '初稿', '2025-09-11', '2025-09-11', '', '2025-10-12 02:40:00.3004', '2025-10-12 02:40:27.885796');
INSERT INTO public.progresses VALUES (40, 11, '公司对方案', '2025-09-12', '2025-09-12', '', '2025-10-12 02:52:04.712775', '2025-10-12 02:52:12.959057');
INSERT INTO public.progresses VALUES (41, 11, '改图', '2025-10-13', '2025-10-13', '修改方案', '2025-10-12 03:00:15.575852', '2025-10-12 03:00:20.72917');
INSERT INTO public.progresses VALUES (42, 11, '改图', '2025-09-22', '2025-09-22', '重新出方案', '2025-10-12 03:01:07.350041', '2025-10-12 03:01:30.319636');
INSERT INTO public.progresses VALUES (43, 11, '客户确认图', '2025-09-23', '2025-09-23', '发效果图给客户  等客户确认  初步方案已完成  等交房', '2025-10-12 03:02:32.877449', '2025-10-12 03:02:45.02152');
INSERT INTO public.progresses VALUES (68, 18, '量尺', '2025-08-02', NULL, '', '2025-10-12 07:03:02.658402', '2025-10-12 07:03:02.658404');
INSERT INTO public.progresses VALUES (48, 12, '复尺', '2025-09-18', '2025-09-18', '复尺出预报价', '2025-10-12 03:10:21.186635', '2025-10-12 03:10:32.840311');
INSERT INTO public.progresses VALUES (47, 12, '改图', '2025-09-22', '2025-09-28', '', '2025-10-12 03:08:20.760519', '2025-10-12 03:12:28.969126');
INSERT INTO public.progresses VALUES (46, 12, '公司对方案', '2025-09-29', '2025-10-04', '修改方案', '2025-10-12 03:07:42.130507', '2025-10-12 03:13:30.679778');
INSERT INTO public.progresses VALUES (49, 12, '报价', '2025-10-07', '2025-10-12', '客户来对报价', '2025-10-12 03:13:54.902911', '2025-10-12 03:14:09.963449');
INSERT INTO public.progresses VALUES (50, 13, '等交房', '2025-10-31', NULL, '', '2025-10-12 03:15:36.088833', '2025-10-12 03:15:36.088835');
INSERT INTO public.progresses VALUES (51, 14, '初稿', '2025-10-05', '2025-10-06', '', '2025-10-12 03:36:20.680755', '2025-10-12 03:36:26.305691');
INSERT INTO public.progresses VALUES (52, 14, '公司对方案', '2025-10-08', '2025-10-08', '', '2025-10-12 03:36:35.813933', '2025-10-12 03:36:40.680694');
INSERT INTO public.progresses VALUES (54, 15, '量尺', '2025-10-10', '2025-10-10', '', '2025-10-12 03:38:12.967163', '2025-10-12 03:38:18.019611');
INSERT INTO public.progresses VALUES (57, 17, '改图', '2025-08-06', '2025-08-06', '', '2025-10-12 05:21:57.298692', '2025-10-12 05:22:20.826621');
INSERT INTO public.progresses VALUES (56, 17, '初稿', '2025-08-04', '2025-08-04', '', '2025-10-12 05:21:33.456614', '2025-10-12 05:22:31.246205');
INSERT INTO public.progresses VALUES (58, 17, '客户来钻石店对方案', '2025-08-12', '2025-08-12', '', '2025-10-12 05:23:30.713249', '2025-10-12 05:23:42.752999');
INSERT INTO public.progresses VALUES (59, 17, '选石材  ', '2025-08-17', '2025-08-17', '', '2025-10-12 05:24:59.750543', '2025-10-12 05:25:12.644506');
INSERT INTO public.progresses VALUES (60, 17, '客户硬装阶段', '2025-08-18', NULL, '', '2025-10-12 05:25:41.737452', '2025-10-12 05:25:41.737455');
INSERT INTO public.progresses VALUES (65, 18, '现场交底', '2025-08-15', NULL, '', '2025-10-12 05:28:57.682448', '2025-10-12 05:28:57.682451');
INSERT INTO public.progresses VALUES (69, 20, '量尺', '2025-08-02', '2025-08-02', '', '2025-10-12 07:05:00.120376', '2025-10-12 07:05:08.116887');
INSERT INTO public.progresses VALUES (70, 20, '初稿', '2025-08-04', '2025-08-04', '', '2025-10-12 07:05:30.816179', '2025-10-12 07:05:38.927605');
INSERT INTO public.progresses VALUES (71, 20, '改图', '2025-08-07', '2025-08-07', '', '2025-10-12 07:05:51.693549', '2025-10-12 07:06:05.957775');
INSERT INTO public.progresses VALUES (72, 20, '等客户确认颜色', '2025-08-18', NULL, '客户不在', '2025-10-12 07:06:35.214815', '2025-10-12 07:06:48.639042');
INSERT INTO public.progresses VALUES (73, 21, '初稿', '2025-09-05', '2025-09-07', '', '2025-10-12 07:08:59.08447', '2025-10-12 07:09:14.925478');
INSERT INTO public.progresses VALUES (74, 21, '客户确认图', '2025-09-19', '2025-09-19', '', '2025-10-12 07:09:25.109998', '2025-10-12 07:09:54.653636');
INSERT INTO public.progresses VALUES (66, 18, '客户硬装阶段', '2025-08-15', '2025-08-15', '', '2025-10-12 05:29:17.296056', '2025-10-12 07:11:00.028611');
INSERT INTO public.progresses VALUES (75, 21, '报价', '2025-09-19', '2025-09-19', '', '2025-10-12 07:10:52.482801', '2025-10-12 07:11:00.170424');
INSERT INTO public.progresses VALUES (61, 18, '分单', '2025-08-07', '2025-08-07', '', '2025-10-12 05:27:35.302176', '2025-10-12 07:12:09.224812');
INSERT INTO public.progresses VALUES (64, 18, '沟通电视柜', '2025-08-12', '2025-08-12', '', '2025-10-12 05:28:31.322099', '2025-10-12 07:11:35.16245');
INSERT INTO public.progresses VALUES (63, 18, '客户确认图', '2025-08-09', '2025-08-09', '', '2025-10-12 05:28:01.829887', '2025-10-12 07:11:44.146199');
INSERT INTO public.progresses VALUES (62, 18, '初稿', '2025-08-08', '2025-08-08', '', '2025-10-12 05:27:47.024415', '2025-10-12 07:11:54.444716');
INSERT INTO public.progresses VALUES (77, 22, '客户确认图', '2025-09-15', '2025-10-15', '', '2025-10-12 07:13:14.548764', '2025-10-12 07:13:22.978912');
INSERT INTO public.progresses VALUES (76, 22, '初稿', '2025-09-06', '2025-09-08', '', '2025-10-12 07:12:28.330682', '2025-10-12 07:12:53.964499');
INSERT INTO public.progresses VALUES (67, 19, '分单日期', '2025-07-24', '2025-07-24', '', '2025-10-12 06:58:26.112226', '2025-10-12 07:13:38.061638');
INSERT INTO public.progresses VALUES (78, 22, '改图', '2025-09-18', '2025-09-18', '', '2025-10-12 07:13:28.74814', '2025-10-12 07:13:40.210015');
INSERT INTO public.progresses VALUES (79, 22, '出效果图', '2025-10-20', '2025-09-20', '', '2025-10-12 07:14:05.558604', '2025-10-12 07:14:25.322678');
INSERT INTO public.progresses VALUES (81, 19, 'CAD深化', '2025-07-26', '2025-07-26', '', '2025-10-12 07:15:01.752472', '2025-10-12 07:15:12.009412');
INSERT INTO public.progresses VALUES (82, 22, '改图', '2025-09-29', '2025-09-29', '', '2025-10-12 07:15:04.355201', '2025-10-12 07:15:17.906072');
INSERT INTO public.progresses VALUES (80, 22, '客户确认图', '2025-09-20', '2025-09-20', '', '2025-10-12 07:14:38.165939', '2025-10-12 07:15:56.35114');
INSERT INTO public.progresses VALUES (84, 22, '约客户来公司', '2025-10-05', '2025-10-05', '', '2025-10-12 07:16:32.071595', '2025-10-12 07:16:38.187059');
INSERT INTO public.progresses VALUES (83, 19, '客户硬装阶段', '2025-07-26', '2025-07-26', '', '2025-10-12 07:16:24.372173', '2025-10-12 07:16:39.266639');
INSERT INTO public.progresses VALUES (85, 22, '改图', '2025-10-11', '2025-10-11', '', '2025-10-12 07:16:54.20935', '2025-10-12 07:16:59.81099');
INSERT INTO public.progresses VALUES (86, 24, '客户确认图', '2025-09-15', '2025-09-15', '', '2025-10-12 07:21:14.122338', '2025-10-12 07:21:29.221245');
INSERT INTO public.progresses VALUES (87, 25, '量尺', '2025-09-14', '2025-09-14', '', '2025-10-12 07:22:26.434177', '2025-10-12 07:22:32.260759');
INSERT INTO public.progresses VALUES (55, 16, '量尺', '2025-10-13', '2025-10-13', '', '2025-10-12 03:39:47.132111', '2025-10-14 01:08:29.902394');
INSERT INTO public.progresses VALUES (89, 25, '改图', '2025-09-22', '2025-09-22', '', '2025-10-12 07:23:04.622999', '2025-10-12 07:23:13.87508');
INSERT INTO public.progresses VALUES (88, 26, '初稿', '2025-09-17', '2025-09-19', '', '2025-10-12 07:22:58.109042', '2025-10-12 07:23:25.931264');
INSERT INTO public.progresses VALUES (90, 26, '改图', '2025-09-20', '2025-09-24', '', '2025-10-12 07:23:38.749101', '2025-10-12 07:24:07.978751');
INSERT INTO public.progresses VALUES (135, 39, '改图', '2025-07-24', '2025-07-24', '改CAD', '2025-10-12 08:30:26.308737', '2025-10-12 08:30:37.462477');
INSERT INTO public.progresses VALUES (92, 26, '复尺', '2025-09-25', '2025-09-25', '等客户复尺', '2025-10-12 07:24:40.624464', '2025-10-12 07:25:02.933724');
INSERT INTO public.progresses VALUES (93, 26, '客户确认图', '2025-10-10', NULL, '', '2025-10-12 07:25:57.362742', '2025-10-12 07:25:57.362745');
INSERT INTO public.progresses VALUES (95, 28, '量尺', '2025-09-22', '2025-09-22', '', '2025-10-12 07:26:59.340019', '2025-10-12 07:27:24.502904');
INSERT INTO public.progresses VALUES (96, 28, '初稿', '2025-09-25', '2025-09-25', '', '2025-10-12 07:27:45.770954', '2025-10-12 07:27:52.212513');
INSERT INTO public.progresses VALUES (97, 28, '出效果图', '2025-10-05', '2025-10-06', '', '2025-10-12 07:28:08.381517', '2025-10-12 07:28:17.925626');
INSERT INTO public.progresses VALUES (98, 28, '客户确认图', '2025-10-06', NULL, '', '2025-10-12 07:28:26.980533', '2025-10-12 07:28:26.980536');
INSERT INTO public.progresses VALUES (99, 28, '暂停', '2025-10-07', '2025-10-07', '', '2025-10-12 07:28:37.998683', '2025-10-12 07:28:47.171003');
INSERT INTO public.progresses VALUES (100, 29, '初稿', '2025-09-30', '2025-09-30', '', '2025-10-12 07:35:56.944501', '2025-10-12 07:36:05.795109');
INSERT INTO public.progresses VALUES (101, 29, '改图', '2025-10-04', '2025-10-05', '', '2025-10-12 07:36:15.058687', '2025-10-12 07:36:24.882741');
INSERT INTO public.progresses VALUES (102, 29, '客户确认图', '2025-10-07', '2025-10-07', '', '2025-10-12 07:36:46.572568', '2025-10-12 07:36:54.591416');
INSERT INTO public.progresses VALUES (103, 29, '报价', '2025-10-08', '2025-10-08', '', '2025-10-12 07:37:03.264494', '2025-10-12 07:37:07.620035');
INSERT INTO public.progresses VALUES (104, 29, '打款', '2025-10-10', '2025-10-10', '', '2025-10-12 07:37:21.519393', '2025-10-12 07:37:26.675844');
INSERT INTO public.progresses VALUES (94, 27, '初稿', '2025-09-26', '2025-09-29', '', '2025-10-12 07:26:12.13067', '2025-10-12 07:37:50.247974');
INSERT INTO public.progresses VALUES (106, 30, '初稿', '2025-10-07', '2025-10-07', '', '2025-10-12 07:38:37.007128', '2025-10-12 07:38:47.416743');
INSERT INTO public.progresses VALUES (136, 39, '改图', '2025-07-29', '2025-07-29', '', '2025-10-12 08:30:59.721771', '2025-10-12 08:31:12.460548');
INSERT INTO public.progresses VALUES (105, 27, '公司对方案', '2025-10-04', NULL, '改图', '2025-10-12 07:38:07.419217', '2025-10-12 07:39:16.623484');
INSERT INTO public.progresses VALUES (107, 30, '改图', '2025-10-10', '2025-10-10', '修改效果图', '2025-10-12 07:39:15.357707', '2025-10-12 07:39:20.296186');
INSERT INTO public.progresses VALUES (108, 30, '客户确认图', '2025-10-11', NULL, '', '2025-10-12 07:39:27.538974', '2025-10-12 07:39:27.538976');
INSERT INTO public.progresses VALUES (109, 27, '改图', '2025-10-08', '2025-10-08', '', '2025-10-12 07:39:40.36793', '2025-10-12 07:39:47.982706');
INSERT INTO public.progresses VALUES (111, 31, '初稿', '2025-10-11', '2025-10-11', '', '2025-10-12 07:40:47.429357', '2025-10-12 07:40:54.513573');
INSERT INTO public.progresses VALUES (112, 31, '打款', '2025-10-10', '2025-10-10', '', '2025-10-12 07:41:06.768251', '2025-10-12 07:41:12.528872');
INSERT INTO public.progresses VALUES (113, 31, '公司对方案', '2025-10-11', '2025-10-11', '', '2025-10-12 07:41:24.352566', '2025-10-12 07:41:28.834867');
INSERT INTO public.progresses VALUES (114, 32, '量尺', '2025-09-26', '2025-09-26', '', '2025-10-12 07:43:00.958189', '2025-10-12 07:43:08.651434');
INSERT INTO public.progresses VALUES (115, 33, '初稿', '2025-10-07', '2025-10-07', '', '2025-10-12 07:43:15.018027', '2025-10-12 07:43:19.237957');
INSERT INTO public.progresses VALUES (116, 32, '初稿', '2025-10-08', '2025-10-08', '', '2025-10-12 07:43:24.184909', '2025-10-12 07:43:37.056424');
INSERT INTO public.progresses VALUES (117, 33, '报价', '2025-10-07', '2025-10-07', '', '2025-10-12 07:43:30.168596', '2025-10-12 07:43:47.426883');
INSERT INTO public.progresses VALUES (118, 33, '初稿', '2025-10-07', '2025-10-07', '', '2025-10-12 07:43:38.206932', '2025-10-12 07:43:52.059724');
INSERT INTO public.progresses VALUES (119, 32, '公司对方案', '2025-10-12', '2025-10-12', '', '2025-10-12 07:43:51.157229', '2025-10-12 07:44:00.49351');
INSERT INTO public.progresses VALUES (120, 35, '量尺', '2025-10-08', '2025-10-08', '', '2025-10-12 07:45:41.366055', '2025-10-12 07:45:45.937453');
INSERT INTO public.progresses VALUES (121, 36, '初稿', '2025-09-30', '2025-09-30', '', '2025-10-12 07:45:59.078318', '2025-10-12 07:46:06.212066');
INSERT INTO public.progresses VALUES (123, 36, '改图', '2025-10-04', '2025-10-04', '', '2025-10-12 07:46:24.787974', '2025-10-12 07:46:30.371712');
INSERT INTO public.progresses VALUES (125, 37, '量尺', '2025-10-11', '2025-10-11', '', '2025-10-12 07:46:48.078545', '2025-10-12 07:46:55.404242');
INSERT INTO public.progresses VALUES (124, 36, '报价', '2025-10-04', '2025-10-04', '', '2025-10-12 07:46:46.49091', '2025-10-12 07:46:56.853343');
INSERT INTO public.progresses VALUES (126, 37, '报价', '2025-07-15', '2025-07-15', '预报价', '2025-10-12 07:47:26.271792', '2025-10-12 07:47:43.522122');
INSERT INTO public.progresses VALUES (128, 36, '等客户提供尺寸改图', '2025-10-14', NULL, '', '2025-10-12 07:48:42.510774', '2025-10-12 07:48:42.510777');
INSERT INTO public.progresses VALUES (129, 38, '线上对方案', '2025-06-10', '2025-06-10', '', '2025-10-12 08:25:36.362941', '2025-10-12 08:25:44.642773');
INSERT INTO public.progresses VALUES (130, 38, '调整方案', '2025-08-05', '2025-08-12', '', '2025-10-12 08:26:11.950986', '2025-10-12 08:26:24.94558');
INSERT INTO public.progresses VALUES (131, 38, '报价', '2025-08-13', NULL, '', '2025-10-12 08:26:48.142597', '2025-10-12 08:26:48.142599');
INSERT INTO public.progresses VALUES (132, 39, '初稿', '2025-06-09', '2025-06-09', '', '2025-10-12 08:28:37.529915', '2025-10-12 08:28:48.285131');
INSERT INTO public.progresses VALUES (133, 39, '改图', '2025-07-13', '2025-07-13', '', '2025-10-12 08:29:05.057851', '2025-10-12 08:29:18.393975');
INSERT INTO public.progresses VALUES (134, 39, '出效果图', '2025-07-14', '2025-07-23', '', '2025-10-12 08:29:55.209727', '2025-10-12 08:30:06.999044');
INSERT INTO public.progresses VALUES (137, 39, '报价', '2025-07-30', '2025-07-30', '', '2025-10-12 08:32:11.385619', '2025-10-12 08:32:18.972002');
INSERT INTO public.progresses VALUES (138, 40, '初稿', '2025-07-20', '2025-07-20', '', '2025-10-12 08:33:21.232774', '2025-10-12 08:33:30.415685');
INSERT INTO public.progresses VALUES (139, 40, '改图', '2025-07-21', '2025-07-21', '', '2025-10-12 08:33:45.324439', '2025-10-12 08:33:52.502488');
INSERT INTO public.progresses VALUES (140, 40, '出效果图', '2025-07-29', '2025-07-29', '', '2025-10-12 08:34:23.124468', '2025-10-12 08:34:34.051146');
INSERT INTO public.progresses VALUES (141, 40, '改图', '2025-08-02', '2025-08-04', '', '2025-10-12 08:34:46.803719', '2025-10-12 08:34:53.965003');
INSERT INTO public.progresses VALUES (142, 40, '客户硬装阶段', '2025-08-04', NULL, '', '2025-10-12 08:35:10.967476', '2025-10-12 08:35:10.967478');
INSERT INTO public.progresses VALUES (143, 41, '初稿', '2025-07-26', '2025-07-26', '', '2025-10-12 08:36:38.349766', '2025-10-12 08:36:47.437565');
INSERT INTO public.progresses VALUES (144, 41, '报价', '2025-07-31', '2025-07-31', '', '2025-10-12 08:36:59.791833', '2025-10-12 08:37:16.458373');
INSERT INTO public.progresses VALUES (145, 41, '报价', '2025-09-16', '2025-09-19', '重新报价', '2025-10-12 08:37:36.486565', '2025-10-12 08:37:48.275001');
INSERT INTO public.progresses VALUES (147, 41, '客户硬装阶段', '2025-10-11', NULL, '阳台砖未贴', '2025-10-12 08:38:54.44704', '2025-10-12 08:38:54.447042');
INSERT INTO public.progresses VALUES (146, 41, '复尺', '2025-09-30', '2025-09-30', '', '2025-10-12 08:38:06.036765', '2025-10-12 08:39:11.274007');
INSERT INTO public.progresses VALUES (148, 43, '公司对方案', '2025-08-16', '2025-08-17', '', '2025-10-12 08:40:38.057496', '2025-10-12 08:41:15.698908');
INSERT INTO public.progresses VALUES (149, 42, '初稿', '2025-07-03', '2025-07-03', '', '2025-10-12 08:40:57.830234', '2025-10-12 08:41:30.600241');
INSERT INTO public.progresses VALUES (150, 43, '改图', '2025-08-27', '2025-08-27', '', '2025-10-12 08:41:31.449958', '2025-10-12 08:41:41.976366');
INSERT INTO public.progresses VALUES (152, 42, '改图', '2025-07-18', '2025-07-18', '', '2025-10-12 08:41:54.32964', '2025-10-12 08:42:02.01267');
INSERT INTO public.progresses VALUES (151, 43, '公司对方案', '2025-09-03', '2025-09-05', '', '2025-10-12 08:41:52.525401', '2025-10-12 08:42:04.007748');
INSERT INTO public.progresses VALUES (153, 42, '改图', '2025-08-06', '2025-08-06', '', '2025-10-12 08:42:20.079937', '2025-10-12 08:42:26.733608');
INSERT INTO public.progresses VALUES (154, 43, '客户确认图', '2025-09-06', NULL, '', '2025-10-12 08:42:39.988481', '2025-10-12 08:42:39.988483');
INSERT INTO public.progresses VALUES (156, 42, '改图', '2025-09-24', '2025-09-24', '', '2025-10-12 08:43:03.268956', '2025-10-12 08:43:08.710795');
INSERT INTO public.progresses VALUES (155, 43, '改图', '2025-09-15', '2025-09-25', '', '2025-10-12 08:42:54.385235', '2025-10-12 08:43:13.294061');
INSERT INTO public.progresses VALUES (158, 42, '改图', '2025-10-08', '2025-10-08', '', '2025-10-12 08:43:25.427365', '2025-10-12 08:43:31.165261');
INSERT INTO public.progresses VALUES (157, 43, '客户确认图', '2025-09-30', '2025-10-11', '跟李总对图', '2025-10-12 08:43:24.772153', '2025-10-12 08:43:42.571382');
INSERT INTO public.progresses VALUES (159, 42, '公司对方案', '2025-10-11', '2025-10-11', '', '2025-10-12 08:43:49.554336', '2025-10-12 08:43:54.787832');
INSERT INTO public.progresses VALUES (161, 44, '初稿', '2025-08-25', '2025-08-25', '', '2025-10-12 08:45:05.750216', '2025-10-12 08:45:13.999862');
INSERT INTO public.progresses VALUES (162, 44, '改图', '2025-09-18', '2025-09-18', '', '2025-10-12 08:45:21.931997', '2025-10-12 08:45:31.406373');
INSERT INTO public.progresses VALUES (163, 44, '改水电', '2025-09-30', NULL, '', '2025-10-12 08:45:53.944491', '2025-10-12 08:45:53.944494');
INSERT INTO public.progresses VALUES (164, 45, '量尺', '2025-10-05', '2025-10-05', '', '2025-10-12 08:47:21.378965', '2025-10-12 08:47:26.217112');
INSERT INTO public.progresses VALUES (165, 46, '报价', '2025-08-29', '2025-08-29', '', '2025-10-12 08:47:30.149118', '2025-10-12 08:47:47.417728');
INSERT INTO public.progresses VALUES (166, 46, '量尺', '2025-09-13', '2025-09-13', '', '2025-10-12 08:48:06.366787', '2025-10-12 08:48:14.279028');
INSERT INTO public.progresses VALUES (168, 45, '初稿', '2025-10-08', '2025-10-10', '', '2025-10-12 08:49:01.038836', '2025-10-12 08:49:10.552127');
INSERT INTO public.progresses VALUES (167, 46, '出效果图', '2025-09-17', '2025-09-17', '', '2025-10-12 08:48:52.125952', '2025-10-12 08:49:14.660693');
INSERT INTO public.progresses VALUES (169, 45, '改图', '2025-10-11', '2025-10-11', '', '2025-10-12 08:49:19.588396', '2025-10-12 08:49:28.611442');
INSERT INTO public.progresses VALUES (170, 46, '客户确认图', '2025-09-19', '2025-09-19', '', '2025-10-12 08:49:21.65888', '2025-10-12 08:49:40.268095');
INSERT INTO public.progresses VALUES (172, 45, '客户确认图', '2025-10-12', NULL, '', '2025-10-12 08:50:53.072148', '2025-10-12 08:50:53.072151');
INSERT INTO public.progresses VALUES (171, 46, '改图', '2025-09-21', '2025-09-25', '', '2025-10-12 08:50:46.813445', '2025-10-12 08:50:58.016885');
INSERT INTO public.progresses VALUES (173, 46, '改效果图', '2025-09-26', '2025-09-26', '', '2025-10-12 08:51:27.635381', '2025-10-12 08:51:49.103627');
INSERT INTO public.progresses VALUES (175, 47, '量尺', '2025-08-29', '2025-08-29', '', '2025-10-12 08:53:08.839883', '2025-10-12 08:53:15.515271');
INSERT INTO public.progresses VALUES (176, 47, '报价', '2025-08-31', '2025-08-31', '', '2025-10-12 08:53:54.861414', '2025-10-12 08:54:38.970757');
INSERT INTO public.progresses VALUES (177, 47, '初稿', '2025-09-08', '2025-09-08', '', '2025-10-12 08:54:57.585506', '2025-10-12 08:55:05.829968');
INSERT INTO public.progresses VALUES (127, 37, '约客户复尺', '2025-10-11', '2025-10-11', '', '2025-10-12 07:48:04.359354', '2025-10-13 00:48:19.579701');
INSERT INTO public.progresses VALUES (122, 35, '初稿', '2025-10-12', '2025-10-12', '', '2025-10-12 07:45:59.26506', '2025-10-13 00:49:22.087142');
INSERT INTO public.progresses VALUES (91, 25, '客户确认图', '2025-09-28', '2025-10-12', '', '2025-10-12 07:24:00.577957', '2025-10-13 01:00:02.47495');
INSERT INTO public.progresses VALUES (160, 42, '改图', '2025-10-12', '2025-10-11', '', '2025-10-12 08:44:12.221499', '2025-10-13 01:02:03.811825');
INSERT INTO public.progresses VALUES (174, 46, '客户确认图', '2025-10-11', '2025-10-11', '', '2025-10-12 08:52:07.050342', '2025-10-14 00:35:04.646021');
INSERT INTO public.progresses VALUES (178, 47, '改图', '2025-09-10', '2025-09-10', '', '2025-10-12 08:55:26.217307', '2025-10-12 08:55:34.14956');
INSERT INTO public.progresses VALUES (179, 47, '复尺', '2025-09-12', '2025-09-12', '', '2025-10-12 08:56:24.414666', '2025-10-12 08:56:30.362916');
INSERT INTO public.progresses VALUES (180, 47, '客户确认图', '2025-09-19', '2025-09-30', '', '2025-10-12 08:56:44.528041', '2025-10-12 08:56:53.578502');
INSERT INTO public.progresses VALUES (181, 47, '下单', '2025-10-12', NULL, '', '2025-10-12 08:57:17.437178', '2025-10-12 08:57:17.43718');
INSERT INTO public.progresses VALUES (182, 48, '量尺', '2025-09-04', '2025-09-04', '', '2025-10-12 08:58:22.885524', '2025-10-12 08:58:28.067641');
INSERT INTO public.progresses VALUES (183, 48, '初稿', '2025-09-05', '2025-09-07', '', '2025-10-12 08:58:38.850781', '2025-10-12 08:58:53.612976');
INSERT INTO public.progresses VALUES (184, 48, '改图', '2025-09-11', '2025-09-11', '', '2025-10-12 08:59:05.38413', '2025-10-12 08:59:19.906752');
INSERT INTO public.progresses VALUES (223, 61, '下单', '2025-10-09', '2025-10-12', '', '2025-10-12 09:58:52.435126', '2025-10-12 09:58:57.41464');
INSERT INTO public.progresses VALUES (185, 48, '客户确认图', '2025-09-12', '2025-09-12', '', '2025-10-12 08:59:47.953676', '2025-10-12 09:00:36.215702');
INSERT INTO public.progresses VALUES (186, 48, '改图', '2025-09-22', '2025-09-22', '', '2025-10-12 09:00:07.793046', '2025-10-12 09:00:47.128534');
INSERT INTO public.progresses VALUES (187, 48, '报价', '2025-09-23', '2025-09-30', '预报价', '2025-10-12 09:00:58.307738', '2025-10-12 09:01:30.845011');
INSERT INTO public.progresses VALUES (188, 48, '客户硬装阶段', '2025-10-11', NULL, '', '2025-10-12 09:01:45.971188', '2025-10-12 09:01:45.97119');
INSERT INTO public.progresses VALUES (189, 49, '量尺', '2025-09-13', '2025-09-13', '', '2025-10-12 09:03:02.615879', '2025-10-12 09:03:41.561921');
INSERT INTO public.progresses VALUES (190, 49, '报价', '2025-09-15', '2025-10-19', '等客户确认报价', '2025-10-12 09:03:28.691833', '2025-10-12 09:04:01.140704');
INSERT INTO public.progresses VALUES (191, 49, '改图', '2025-09-20', '2025-09-20', '', '2025-10-12 09:04:11.156049', '2025-10-12 09:04:26.301118');
INSERT INTO public.progresses VALUES (192, 49, '修改报价', '2025-09-21', '2025-09-21', '', '2025-10-12 09:04:44.557038', '2025-10-12 09:04:51.926824');
INSERT INTO public.progresses VALUES (193, 49, '复尺', '2025-09-29', '2025-09-29', '', '2025-10-12 09:05:15.032522', '2025-10-12 09:05:27.483423');
INSERT INTO public.progresses VALUES (194, 49, '等客户打款', '2025-10-10', NULL, '', '2025-10-12 09:05:44.171459', '2025-10-12 09:05:44.171461');
INSERT INTO public.progresses VALUES (195, 50, '量尺', '2025-09-20', '2025-09-20', '', '2025-10-12 09:06:50.589852', '2025-10-12 09:06:58.889974');
INSERT INTO public.progresses VALUES (196, 50, '等客户打定金', '2025-09-25', '2025-10-27', '', '2025-10-12 09:07:20.366742', '2025-10-12 09:07:26.837427');
INSERT INTO public.progresses VALUES (197, 50, '复尺', '2025-09-30', '2025-09-30', '', '2025-10-12 09:07:38.327874', '2025-10-12 09:07:42.438332');
INSERT INTO public.progresses VALUES (198, 50, '出效果图', '2025-10-12', NULL, '', '2025-10-12 09:08:03.12348', '2025-10-12 09:08:03.123482');
INSERT INTO public.progresses VALUES (199, 51, '量尺', '2025-09-29', '2025-09-29', '', '2025-10-12 09:08:49.5964', '2025-10-12 09:08:54.240383');
INSERT INTO public.progresses VALUES (200, 51, '出效果图', '2025-10-11', '2025-10-11', '', '2025-10-12 09:09:08.591031', '2025-10-12 09:09:24.297075');
INSERT INTO public.progresses VALUES (201, 55, '报价', '2025-10-11', '2025-10-11', '', '2025-10-12 09:13:18.867083', '2025-10-12 09:13:28.994457');
INSERT INTO public.progresses VALUES (202, 58, '水电交底', '2025-07-01', '2025-07-01', '', '2025-10-12 09:25:08.336562', '2025-10-12 09:25:15.389421');
INSERT INTO public.progresses VALUES (203, 58, '初稿', '2025-07-26', '2025-07-26', '', '2025-10-12 09:25:28.058056', '2025-10-12 09:25:48.89417');
INSERT INTO public.progresses VALUES (204, 58, '改图', '2025-09-11', '2025-09-11', '', '2025-10-12 09:26:20.153002', '2025-10-12 09:26:26.217868');
INSERT INTO public.progresses VALUES (205, 58, '复尺', '2025-09-11', '2025-09-25', '', '2025-10-12 09:26:41.704333', '2025-10-12 09:27:01.800979');
INSERT INTO public.progresses VALUES (206, 58, '公司对方案', '2025-09-23', '2025-09-23', '', '2025-10-12 09:27:23.521844', '2025-10-12 09:27:36.899517');
INSERT INTO public.progresses VALUES (207, 58, '等客户提供电器尺寸', '2025-09-28', '2025-09-28', '', '2025-10-12 09:28:22.192597', '2025-10-12 09:28:34.351198');
INSERT INTO public.progresses VALUES (208, 58, '报价', '2025-09-28', '2025-09-28', '', '2025-10-12 09:29:04.507779', '2025-10-12 09:29:10.412666');
INSERT INTO public.progresses VALUES (209, 58, '打款', '2025-09-29', '2025-09-29', '', '2025-10-12 09:29:34.838184', '2025-10-12 09:29:47.254214');
INSERT INTO public.progresses VALUES (210, 58, '下单', '2025-09-30', '2025-10-12', '', '2025-10-12 09:30:00.663669', '2025-10-12 09:32:19.406444');
INSERT INTO public.progresses VALUES (211, 60, '报价', '2025-08-27', '2025-08-27', '预报价', '2025-10-12 09:42:32.232498', '2025-10-12 09:42:41.192823');
INSERT INTO public.progresses VALUES (212, 60, '设计、杨总对方案', '2025-09-03', '2025-09-03', '', '2025-10-12 09:43:22.086572', '2025-10-12 09:43:27.260883');
INSERT INTO public.progresses VALUES (213, 60, '公司对方案', '2025-09-04', '2025-09-04', '', '2025-10-12 09:43:41.121914', '2025-10-12 09:43:46.779634');
INSERT INTO public.progresses VALUES (214, 60, '初稿', '2025-09-06', '2025-09-10', '', '2025-10-12 09:43:56.08796', '2025-10-12 09:44:08.621851');
INSERT INTO public.progresses VALUES (215, 60, '客户确认图', '2025-09-11', '2025-09-15', '', '2025-10-12 09:44:39.250629', '2025-10-12 09:44:46.595233');
INSERT INTO public.progresses VALUES (216, 60, '客户硬装阶段', '2025-09-19', '2025-09-28', '', '2025-10-12 09:44:57.413858', '2025-10-12 09:45:14.441375');
INSERT INTO public.progresses VALUES (217, 60, '公司对方案', '2025-09-28', '2025-09-28', '', '2025-10-12 09:45:29.422543', '2025-10-12 09:45:36.424648');
INSERT INTO public.progresses VALUES (218, 60, '改图', '2025-09-29', '2025-09-29', '', '2025-10-12 09:45:59.04972', '2025-10-12 09:46:05.096735');
INSERT INTO public.progresses VALUES (219, 60, '等客户提供电器尺寸', '2026-09-05', '2025-10-05', '', '2025-10-12 09:46:32.673179', '2025-10-12 09:46:42.910912');
INSERT INTO public.progresses VALUES (220, 60, '下单', '2025-10-08', '2025-10-12', '', '2025-10-12 09:47:02.349914', '2025-10-12 09:47:09.119959');
INSERT INTO public.progresses VALUES (221, 57, '报价', '2025-09-26', '2025-10-26', '', '2025-10-12 09:57:32.680356', '2025-10-12 09:57:39.208486');
INSERT INTO public.progresses VALUES (222, 57, '打款', '2025-09-26', '2025-09-26', '', '2025-10-12 09:58:06.08944', '2025-10-12 09:58:11.644101');
INSERT INTO public.progresses VALUES (224, 59, '下单', '2025-10-06', '2025-10-12', '', '2025-10-12 10:01:57.526482', '2025-10-12 10:02:10.487918');
INSERT INTO public.progresses VALUES (225, 15, '初稿', '2025-10-15', NULL, '', '2025-10-13 00:35:54.84982', '2025-10-13 00:35:54.849822');
INSERT INTO public.progresses VALUES (53, 14, '改图', '2025-10-09', '2025-10-10', '', '2025-10-12 03:37:04.367318', '2025-10-13 00:37:05.862726');
INSERT INTO public.progresses VALUES (226, 14, '客户硬装阶段', '2025-11-30', NULL, '', '2025-10-13 00:37:43.359924', '2025-10-13 00:37:43.359926');
INSERT INTO public.progresses VALUES (227, 12, '打款', '2025-10-13', NULL, '', '2025-10-13 00:39:13.204436', '2025-10-13 00:39:13.204439');
INSERT INTO public.progresses VALUES (228, 11, '等交房', '2025-10-31', NULL, '', '2025-10-13 00:40:05.173998', '2025-10-13 00:40:05.174001');
INSERT INTO public.progresses VALUES (229, 7, '暂停', '2025-10-13', NULL, '', '2025-10-13 00:45:19.464992', '2025-10-13 00:45:19.464995');
INSERT INTO public.progresses VALUES (230, 13, '初稿', '2025-10-19', NULL, '', '2025-10-13 00:47:19.083101', '2025-10-13 00:47:19.083104');
INSERT INTO public.progresses VALUES (231, 37, '初稿', '2025-10-14', NULL, '', '2025-10-13 00:48:39.419671', '2025-10-13 00:48:39.419673');
INSERT INTO public.progresses VALUES (232, 33, '打款', '2025-10-15', NULL, '', '2025-10-13 00:49:55.480255', '2025-10-13 00:49:55.480293');
INSERT INTO public.progresses VALUES (234, 29, '复尺', '2025-10-14', NULL, '', '2025-10-13 00:52:04.620229', '2025-10-13 00:52:04.620231');
INSERT INTO public.progresses VALUES (235, 23, '暂停', '2025-10-13', NULL, '', '2025-10-13 00:53:13.527853', '2025-10-13 00:53:13.527856');
INSERT INTO public.progresses VALUES (236, 22, '改图', '2025-10-13', NULL, '', '2025-10-13 00:53:32.151496', '2025-10-13 00:53:32.151499');
INSERT INTO public.progresses VALUES (237, 21, '打款', '2025-10-20', NULL, '', '2025-10-13 00:53:54.414995', '2025-10-13 00:53:54.414997');
INSERT INTO public.progresses VALUES (239, 36, '出内部结构图', '2025-10-14', NULL, '', '2025-10-13 00:57:16.462885', '2025-10-13 00:57:16.462888');
INSERT INTO public.progresses VALUES (240, 32, '客户硬装阶段', '2025-10-20', NULL, '', '2025-10-13 00:57:47.125512', '2025-10-13 00:57:47.125514');
INSERT INTO public.progresses VALUES (241, 27, '改图', '2025-10-15', NULL, '', '2025-10-13 00:59:21.24653', '2025-10-13 00:59:21.246533');
INSERT INTO public.progresses VALUES (242, 27, '报价', '2025-10-15', NULL, '', '2025-10-13 00:59:33.913761', '2025-10-13 00:59:33.913763');
INSERT INTO public.progresses VALUES (110, 27, '公司对方案', '2025-10-11', '2025-10-12', '12号客户到公司', '2025-10-12 07:40:46.444448', '2025-10-13 00:59:35.986677');
INSERT INTO public.progresses VALUES (243, 25, '改图', '2025-10-17', NULL, '', '2025-10-13 01:00:29.577101', '2025-10-13 01:00:29.577103');
INSERT INTO public.progresses VALUES (245, 19, '暂停', '2025-10-13', NULL, '', '2025-10-13 01:01:42.531586', '2025-10-13 01:01:42.531588');
INSERT INTO public.progresses VALUES (246, 42, '客户硬装阶段', '2025-10-16', NULL, '', '2025-10-13 01:02:17.094004', '2025-10-13 01:02:17.094006');
INSERT INTO public.progresses VALUES (247, 63, '打款', '2025-10-13', '2025-10-13', '系统自动创建', '2025-10-13 05:48:56.347427', '2025-10-13 05:48:56.347429');
INSERT INTO public.progresses VALUES (248, 64, '初稿', '2025-08-04', '2025-08-04', '', '2025-10-13 06:02:17.379838', '2025-10-13 06:02:23.224982');
INSERT INTO public.progresses VALUES (249, 64, '打款', '2025-09-05', '2025-09-05', '', '2025-10-13 06:02:50.574786', '2025-10-13 06:02:58.356768');
INSERT INTO public.progresses VALUES (250, 64, '下单', '2025-09-25', '2025-10-13', '', '2025-10-13 06:03:21.140863', '2025-10-13 06:03:28.047734');
INSERT INTO public.progresses VALUES (251, 65, '下单', '2025-09-28', '2025-10-13', '', '2025-10-13 06:07:50.98302', '2025-10-13 06:07:58.99963');
INSERT INTO public.progresses VALUES (252, 66, '初稿', '2025-09-28', '2025-09-28', '', '2025-10-13 06:11:12.88114', '2025-10-13 06:11:22.128222');
INSERT INTO public.progresses VALUES (253, 66, '客户确认图', '2025-10-06', '2025-10-06', '', '2025-10-13 06:11:36.036712', '2025-10-13 06:11:39.861893');
INSERT INTO public.progresses VALUES (254, 66, '下单', '2025-10-08', '2025-10-13', '', '2025-10-13 06:11:53.058341', '2025-10-13 06:11:58.655402');
INSERT INTO public.progresses VALUES (255, 67, '下单', '2025-10-09', '2025-10-13', '', '2025-10-13 06:23:33.067687', '2025-10-13 06:23:47.513576');
INSERT INTO public.progresses VALUES (256, 67, '打款', '2025-10-06', '2025-10-06', '系统自动创建', '2025-10-13 06:25:40.514201', '2025-10-13 06:25:40.514203');
INSERT INTO public.progresses VALUES (257, 65, '打款', '2025-10-14', '2025-10-14', '系统自动创建', '2025-10-13 06:51:23.643112', '2025-10-13 06:51:23.643114');
INSERT INTO public.progresses VALUES (258, 66, '打款', '2025-10-13', '2025-10-13', '系统自动创建', '2025-10-13 06:51:36.107317', '2025-10-13 06:51:36.10732');
INSERT INTO public.progresses VALUES (261, 69, '暂停', '2025-10-13', NULL, '', '2025-10-13 07:48:47.280933', '2025-10-13 07:48:47.280936');
INSERT INTO public.progresses VALUES (262, 69, '下单', '2025-10-13', '2025-10-13', '', '2025-10-13 07:54:23.581386', '2025-10-13 07:55:52.840149');
INSERT INTO public.progresses VALUES (260, 69, '打款', '2025-10-13', '2025-10-13', '', '2025-10-13 07:44:59.559832', '2025-10-13 07:50:28.041556');
INSERT INTO public.progresses VALUES (259, 69, '下单', '2025-10-13', '2025-10-13', '', '2025-10-13 07:44:35.723136', '2025-10-13 07:54:42.690654');
INSERT INTO public.progresses VALUES (263, 70, '打款', '2025-10-13', '2025-10-13', '系统自动创建', '2025-10-13 07:59:52.744056', '2025-10-13 07:59:52.744058');
INSERT INTO public.progresses VALUES (233, 31, '下单', '2025-10-13', '2025-10-13', '', '2025-10-13 00:50:17.53591', '2025-10-13 08:17:29.645978');
INSERT INTO public.progresses VALUES (238, 45, '报价', '2025-10-13', '2025-10-13', '', '2025-10-13 00:56:03.615957', '2025-10-14 00:30:54.179152');
INSERT INTO public.progresses VALUES (244, 17, '报价', '2025-10-01', NULL, '客户说报价高，需要销售对接', '2025-10-13 01:01:25.355438', '2025-10-14 00:31:25.897107');
INSERT INTO public.progresses VALUES (264, 51, '改图', '2025-10-14', NULL, '', '2025-10-14 00:33:31.49971', '2025-10-14 00:33:31.499713');
INSERT INTO public.progresses VALUES (265, 50, '公司对方案', '2025-10-15', NULL, '', '2025-10-14 00:34:07.891449', '2025-10-14 00:34:07.891452');
INSERT INTO public.progresses VALUES (266, 46, '报价', '2025-10-12', '2025-10-12', '', '2025-10-14 00:35:14.077785', '2025-10-14 00:35:20.851425');
INSERT INTO public.progresses VALUES (267, 46, '打款', '2025-10-13', '2025-10-13', '', '2025-10-14 00:35:29.117741', '2025-10-14 00:35:35.771981');
INSERT INTO public.progresses VALUES (268, 46, '复尺', '2025-10-14', NULL, '', '2025-10-14 00:35:46.340554', '2025-10-14 00:35:46.340556');
INSERT INTO public.progresses VALUES (269, 61, '打款', '2025-08-31', '2025-08-31', '系统自动创建', '2025-10-14 01:25:31.534659', '2025-10-14 01:25:31.534661');
INSERT INTO public.progresses VALUES (270, 53, '线上对方案', '2025-10-13', '2025-10-13', '', '2025-10-14 01:43:45.2491', '2025-10-14 01:43:51.228425');
INSERT INTO public.progresses VALUES (271, 53, '报价', '2025-10-13', '2025-10-13', '', '2025-10-14 01:43:59.119688', '2025-10-14 01:44:03.714458');
INSERT INTO public.progresses VALUES (272, 53, '打款', '2025-10-13', '2025-10-13', '', '2025-10-14 01:45:12.091551', '2025-10-14 01:45:16.952416');
INSERT INTO public.progresses VALUES (273, 54, '报价', '2025-10-13', '2025-10-13', '', '2025-10-14 01:58:54.623348', '2025-10-14 01:59:06.323799');
INSERT INTO public.progresses VALUES (274, 54, '打款', '2025-10-13', '2025-10-13', '', '2025-10-14 01:59:01.792889', '2025-10-14 01:59:11.633497');
INSERT INTO public.progresses VALUES (275, 55, '报价', '2025-10-13', '2025-10-13', '', '2025-10-14 01:59:57.577519', '2025-10-14 02:00:02.81568');
INSERT INTO public.progresses VALUES (276, 55, '打款', '2025-10-13', '2025-10-13', '', '2025-10-14 02:00:08.914309', '2025-10-14 02:00:13.807031');


--
-- Data for Name: split_progress; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.split_progress VALUES (9, 3, 'G250809-01', 'INTERNAL', '柜体', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:58:57.422403', '2025-10-12 09:58:57.422405');
INSERT INTO public.split_progress VALUES (10, 3, 'G250809-01', 'EXTERNAL', '石材', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:58:57.422406', '2025-10-12 09:58:57.422406');
INSERT INTO public.split_progress VALUES (11, 3, 'G250809-01', 'INTERNAL', '木门', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:58:57.422407', '2025-10-12 09:58:57.422408');
INSERT INTO public.split_progress VALUES (12, 3, 'G250809-01', 'EXTERNAL', '铝板类', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:58:57.422408', '2025-10-12 09:58:57.422408');
INSERT INTO public.split_progress VALUES (13, 4, 'G251006-04', 'INTERNAL', '柜体', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 10:02:10.492732', '2025-10-12 10:02:10.492735');
INSERT INTO public.split_progress VALUES (4, 2, 'G250830-01', 'INTERNAL', '柜体', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:47:09.12863', '2025-10-12 10:09:13.618232');
INSERT INTO public.split_progress VALUES (5, 2, 'G250830-01', 'EXTERNAL', '铝板类', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:47:09.128633', '2025-10-12 10:09:13.620537');
INSERT INTO public.split_progress VALUES (6, 2, 'G250830-01', 'INTERNAL', '木门', '2025-10-11', '2025-10-11', NULL, NULL, '待处理', NULL, '2025-10-12 09:47:09.128634', '2025-10-12 10:09:13.619438');
INSERT INTO public.split_progress VALUES (7, 2, 'G250830-01', 'EXTERNAL', '钛镁合金门', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:47:09.128635', '2025-10-12 10:09:13.621608');
INSERT INTO public.split_progress VALUES (8, 2, 'G250830-01', 'EXTERNAL', '石材', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-12 09:47:09.128636', '2025-10-12 10:09:13.622691');
INSERT INTO public.split_progress VALUES (16, 7, 'G250804-03', 'INTERNAL', '柜体', '2025-09-30', '2025-09-30', NULL, NULL, '待处理', NULL, '2025-10-13 06:03:28.054575', '2025-10-13 06:05:04.996109');
INSERT INTO public.split_progress VALUES (17, 7, 'G250804-03', 'INTERNAL', '木门', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-13 06:03:28.054578', '2025-10-13 06:05:04.997214');
INSERT INTO public.split_progress VALUES (18, 7, 'G250804-03', 'EXTERNAL', '钛镁合金门', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-13 06:03:28.054579', '2025-10-13 06:05:04.998321');
INSERT INTO public.split_progress VALUES (27, 12, '测试1', 'INTERNAL', '木门', '2025-10-13', '2025-10-16', NULL, NULL, '待处理', NULL, '2025-10-13 07:59:38.476735', '2025-10-13 08:02:23.958855');
INSERT INTO public.split_progress VALUES (28, 12, '测试1', 'INTERNAL', '柜体', '2025-10-13', '2025-10-13', NULL, NULL, '待处理', NULL, '2025-10-13 07:59:38.476738', '2025-10-13 08:02:23.960017');
INSERT INTO public.split_progress VALUES (29, 12, '测试1', 'EXTERNAL', '石材', '2025-10-13', NULL, NULL, NULL, '待处理', NULL, '2025-10-13 08:00:13.695229', '2025-10-13 08:02:23.961078');
INSERT INTO public.split_progress VALUES (31, 12, '测试1', 'EXTERNAL', '钛镁合金门', '2025-10-13', NULL, NULL, NULL, '待处理', NULL, '2025-10-13 08:00:13.695233', '2025-10-13 08:02:23.962081');
INSERT INTO public.split_progress VALUES (32, 13, 'G251004-04', 'INTERNAL', '柜体', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-13 08:17:29.650759', '2025-10-13 08:17:29.650761');
INSERT INTO public.split_progress VALUES (15, 6, 'G250929-02', 'INTERNAL', '柜体', '2025-10-09', '2025-10-13', NULL, NULL, '待处理', NULL, '2025-10-13 05:48:16.328109', '2025-10-13 06:29:35.556738');
INSERT INTO public.split_progress VALUES (21, 10, 'G251006-03', 'INTERNAL', '柜体', '2025-10-09', '2025-10-09', NULL, NULL, '待处理', NULL, '2025-10-13 06:23:47.519875', '2025-10-13 08:20:19.999468');
INSERT INTO public.split_progress VALUES (20, 9, 'G250928-01', 'INTERNAL', '柜体', '2025-10-11', '2025-10-11', NULL, NULL, '待处理', NULL, '2025-10-13 06:11:58.659634', '2025-10-13 06:52:08.746979');
INSERT INTO public.split_progress VALUES (19, 8, 'G250901-02', 'INTERNAL', '柜体', '2025-10-14', '2025-10-14', NULL, NULL, '待处理', NULL, '2025-10-13 06:07:59.004512', '2025-10-13 08:21:17.6928');
INSERT INTO public.split_progress VALUES (24, 11, '测试', 'EXTERNAL', '石材', '2025-10-13', NULL, NULL, NULL, '待处理', NULL, '2025-10-13 07:44:42.914056', '2025-10-13 07:58:37.51305');
INSERT INTO public.split_progress VALUES (25, 11, '测试', 'INTERNAL', '柜体', '2025-10-13', '2025-10-13', NULL, NULL, '待处理', NULL, '2025-10-13 07:44:42.91406', '2025-10-13 07:58:37.510785');
INSERT INTO public.split_progress VALUES (26, 11, '测试', 'INTERNAL', '木门', '2025-10-13', '2025-10-13', NULL, NULL, '待处理', NULL, '2025-10-13 07:58:09.681782', '2025-10-13 07:58:37.511986');
INSERT INTO public.split_progress VALUES (14, 5, 'G250929-01', 'INTERNAL', '柜体', '2025-10-05', '2025-10-09', NULL, NULL, '待处理', '', '2025-10-13 05:46:42.580506', '2025-10-14 01:18:49.611432');
INSERT INTO public.split_progress VALUES (1, 1, 'G250628-02', 'INTERNAL', '柜体', '2025-10-11', NULL, NULL, NULL, '待处理', '', '2025-10-12 09:32:19.415061', '2025-10-14 01:20:51.108611');
INSERT INTO public.split_progress VALUES (2, 1, 'G250628-02', 'EXTERNAL', '钛镁合金门', '2025-10-12', NULL, '2025-10-11', NULL, '待处理', '', '2025-10-12 09:32:19.415064', '2025-10-14 01:20:51.145595');
INSERT INTO public.split_progress VALUES (3, 1, 'G250628-02', 'INTERNAL', '木门', '2025-10-15', NULL, NULL, NULL, '待处理', '', '2025-10-12 09:32:19.415065', '2025-10-14 01:20:51.15024');
INSERT INTO public.split_progress VALUES (33, 14, 'G251013-03', 'INTERNAL', '柜体', '2025-10-15', NULL, NULL, NULL, '待处理', '', '2025-10-14 01:33:26.70941', '2025-10-14 01:34:06.57919');
INSERT INTO public.split_progress VALUES (34, 13, 'G251004-04', 'EXTERNAL', '石材', NULL, NULL, NULL, NULL, '待处理', NULL, '2025-10-14 01:35:44.582885', '2025-10-14 01:35:44.582887');
INSERT INTO public.split_progress VALUES (22, 10, 'G251006-03', 'EXTERNAL', '石材', NULL, NULL, '2025-10-13', '0天', '待处理', NULL, '2025-10-13 06:23:47.519878', '2025-10-14 03:54:04.511049');
INSERT INTO public.split_progress VALUES (23, 10, 'G251006-03', 'EXTERNAL', '铝板类', NULL, NULL, '', NULL, '待处理', NULL, '2025-10-13 06:23:47.519879', '2025-10-14 03:54:04.513963');


--
-- Data for Name: splits; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.splits VALUES (4, 'G251006-04', '西安安荃宅配-华耀城9-1-601', '华阴', '2025-10-12', NULL, '杨博', NULL, NULL, NULL, '生产单', '拆单中', '李圆圆', '未打款', NULL, NULL, '', '2025-10-12 10:02:10.486414', '2025-10-12 10:02:39.666833');
INSERT INTO public.splits VALUES (2, 'G250830-01', '散户-颐和府1-3201', '西安', '2025-10-12', '段增辉', '杨宇', 194809.00, 55.00, 2.84, '设计单', '拆单中', '马鹏', '未打款', NULL, NULL, '', '2025-10-12 09:47:09.118325', '2025-10-12 10:03:00.585555');
INSERT INTO public.splits VALUES (14, 'G251013-03', '绿色家-和府小区6-12楼', '白水', '2025-10-13', NULL, '杨宇', NULL, NULL, NULL, '生产单', '已审核', '马鹏', '未打款', NULL, NULL, '', '2025-10-14 01:33:26.703254', '2025-10-14 01:34:06.620973');
INSERT INTO public.splits VALUES (13, 'G251004-04', '西安钻石店-中南青樾北区11-504', '西安', '2025-10-13', '景兵霖', '李云', NULL, NULL, NULL, '设计单', '拆单中', '李圆圆', '已打款', '2025-10-10', NULL, '', '2025-10-13 08:17:29.644258', '2025-10-14 01:35:44.581131');
INSERT INTO public.splits VALUES (7, 'G250804-03', '张军正-华荣商城自建房', '铜川', '2025-10-13', '杨哲', '姜恩梦', 121500.00, 63.85, 0.00, '设计单', '已审核', '马鹏', '已打款', '2025-09-05', NULL, '', '2025-10-13 06:03:28.046121', '2025-10-13 06:05:05.045445');
INSERT INTO public.splits VALUES (11, '测试', '测试', '在', '2025-10-13', NULL, '高莎', 20000.00, 50.00, 10.00, '设计单', '已下单', '李圆圆', '已打款', '2025-10-13', '2025-10-13', '', '2025-10-13 07:44:42.906962', '2025-10-13 07:58:41.756549');
INSERT INTO public.splits VALUES (10, 'G251006-03', '斯瑞新材料科技产业园定制柜子', '西安', '2025-10-13', '陈朝西', '李云', 224800.00, 213.00, 0.00, '设计单', '已下单', '李圆圆', '已打款', '2025-10-06', '2025-10-13', '', '2025-10-13 06:23:47.511956', '2025-10-13 06:27:03.993397');
INSERT INTO public.splits VALUES (6, 'G250929-02', 'KK美学-西安鼎城悦玺5-2302', '西安', '2025-09-29', NULL, '杨博', 8680.00, 23.52, 0.00, '生产单', '已下单', '李圆圆', '已打款', '2025-10-13', '2025-10-13', '', '2025-10-13 05:48:16.323056', '2025-10-13 06:29:40.538938');
INSERT INTO public.splits VALUES (12, '测试1', '测试1', '测试1', '2025-10-13', NULL, '高莎', 10000.00, 50.00, 10.00, '生产单', '已下单', '李圆圆', '已打款', '2025-10-13', '2025-10-13', '', '2025-10-13 07:59:38.473226', '2025-10-13 08:00:42.498497');
INSERT INTO public.splits VALUES (9, 'G250928-01', '黄陵王总-铁筹小区1-1-103', '黄陵', '2025-10-13', '杨宇涛', '杨宇', 572.00, 1.87, 0.00, '设计单', '已下单', '李圆圆', '已打款', '2025-10-13', '2025-10-13', '', '2025-10-13 06:11:58.654009', '2025-10-13 08:19:26.141305');
INSERT INTO public.splits VALUES (8, 'G250901-02', '鲁总-檀府二期2-801', '铜川', '2025-10-13', '景兵霖', '杨博', NULL, NULL, NULL, '设计单', '已审核', '李圆圆', '已打款', '2025-10-14', NULL, '', '2025-10-13 06:07:58.997963', '2025-10-13 08:21:17.736663');
INSERT INTO public.splits VALUES (1, 'G250628-02', '西安钻石店-龙湖星河学樘府4-1-2601', '西安', '2025-10-12', '高永辉', '李云', 118000.00, 58.94, 30.10, '设计单', '已审核', '马鹏', '已打款', '2025-09-29', NULL, '', '2025-10-12 09:32:19.404774', '2025-10-14 00:48:15.039834');
INSERT INTO public.splits VALUES (5, 'G250929-01', '渭南楷模高定-信达汣溪17-2-1502', '渭南', '2025-09-29', NULL, '杨宇', 5185.00, 13.53, 0.00, '生产单', '已审核', '马鹏', '报价已发未打款', NULL, NULL, '', '2025-10-13 05:46:42.575851', '2025-10-14 01:18:49.654106');
INSERT INTO public.splits VALUES (3, 'G250809-01', '散户-融创望江府 DK2 20号楼 2单元 1601', '西安', '2025-10-12', '段增辉', '杨宇', 140529.00, 65.90, 48.50, '设计单', '拆单中', '李圆圆', '已打款', '2025-08-31', NULL, '', '2025-10-12 09:58:57.412971', '2025-10-14 01:25:31.534333');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('superAdmin', '$2b$12$Kd7aY4H/qQq1MR90Mycmr.LGFBFGb9GfzVCp.cc4dq1/jgsFL6gqW', 'superAdmin', 1, '2025-10-11 07:48:30.964084+00', '2025-10-11 07:48:30.964084+00');
INSERT INTO public.users VALUES ('王芬姣', '$2b$12$eIscyaWvL/nTUlpPoVD5Le8tG33cmV1FgC1Kich8KhIU0pdB2AJ6G', 'clerk', 3, '2025-10-11 08:10:08.49823+00', '2025-10-11 08:10:08.49823+00');
INSERT INTO public.users VALUES ('高莎莎', '$2b$12$7Q3YZ17pkj3ZHThSdpdNF.d.eLiurotslL6tv5Pg3d7XFc.iSyL8O', 'clerk', 4, '2025-10-11 08:10:19.858743+00', '2025-10-11 08:10:19.858743+00');
INSERT INTO public.users VALUES ('张凤娥', '$2b$12$wN5otU5sllZj4Ji2jcd/z.b5VlX/3wi0aX4oI58Uw5Eu3hlZKIF5C', 'finance', 5, '2025-10-11 08:10:27.950267+00', '2025-10-11 08:10:27.950267+00');
INSERT INTO public.users VALUES ('冯文静', '$2b$12$9WcQREf.MXlUwbQ9ZxwLj.qYma9uos6NNDyXKXGeZWmDi1xQRSkpu', 'shipper', 6, '2025-10-11 08:10:37.648628+00', '2025-10-11 08:10:37.648628+00');
INSERT INTO public.users VALUES ('刘妮', '$2b$12$TcY57w3uOzRRZEikHM4m3eiFk7j2dDmJkti7qBXjX6qMhIyVBnkcG', 'auditor', 7, '2025-10-11 08:10:44.768615+00', '2025-10-11 08:10:44.768615+00');
INSERT INTO public.users VALUES ('李圆圆', '$2b$12$7NFaLHy93eMeh1VkhwBkreNL2zNOXOiota3G82LYlx.qbweSz/9A6', 'splitting', 8, '2025-10-11 08:10:59.577095+00', '2025-10-11 08:10:59.577095+00');
INSERT INTO public.users VALUES ('高永辉', '$2b$12$5n7s.A9jmyr8HjtjM6BMZuaiYYjaoB3jqnnISyDeYU3xw.se35rBy', 'designer', 9, '2025-10-11 08:11:07.779524+00', '2025-10-11 08:11:07.779524+00');
INSERT INTO public.users VALUES ('马鹏', '$2b$12$WqJ73lj17rMaynhep4YiYekI22.Bz.C0w48mJ9Sx73zg.hAGScM9a', 'splitting', 10, '2025-10-11 08:11:16.102877+00', '2025-10-11 08:11:16.102877+00');
INSERT INTO public.users VALUES ('段增辉', '$2b$12$jo7woqjetM6eX87.Z31PkeQjJvTUNhmTVULmS3mYJpbLzvAt1Ui7O', 'designer', 11, '2025-10-11 08:11:27.621726+00', '2025-10-11 08:11:27.621726+00');
INSERT INTO public.users VALUES ('杨哲', '$2b$12$FRBRea.79j8uLZjtQHAID.4mymf0TZs3BJIHXkigdb.xMB4GqVrIy', 'designer', 12, '2025-10-11 08:11:37.850498+00', '2025-10-11 08:11:37.850498+00');
INSERT INTO public.users VALUES ('景兵霖', '$2b$12$Aq7H4oPZ5PC5V3upNO8oE.EuYISd/JX31jGwgx1m1ASZaRF6h5XeC', 'designer', 13, '2025-10-11 08:11:49.573594+00', '2025-10-11 08:11:49.573594+00');
INSERT INTO public.users VALUES ('杨宇', '$2b$12$vRbBQNraBLOhRxloqm1oC.kXCVdqoYFc2QueDMK3r4dnw8w7/gmSa', 'salesperson', 14, '2025-10-11 08:12:18.226064+00', '2025-10-11 08:12:18.226064+00');
INSERT INTO public.users VALUES ('杨博', '$2b$12$d5IETKHsmr/3YNEDV.gGjurzJYkzJ7x2yeTHzDdXIsgWM5Z8eAayu', 'salesperson', 15, '2025-10-11 08:12:27.792795+00', '2025-10-11 08:12:27.792795+00');
INSERT INTO public.users VALUES ('李云', '$2b$12$BNJNYunVuCvuXFu3cml1r.Dalrtt1YAgBBZtqKc4fOTfglO2eUVXS', 'salesperson', 16, '2025-10-11 08:12:34.276678+00', '2025-10-11 08:12:34.276678+00');
INSERT INTO public.users VALUES ('李佳颖', '$2b$12$r5K1HSX4WpGQtIvvr8ceOOfDRDxgz.p5J2F4YODEnAq6bHmWZB9ue', 'salesperson', 17, '2025-10-11 08:12:49.073716+00', '2025-10-11 08:12:49.073716+00');
INSERT INTO public.users VALUES ('贺晓娟', '$2b$12$n9Juw38mBdqYeg7I/CYg6eWmgcIRnUvFZFRB7LFAqtETAoEOdXmHO', 'procurement', 18, '2025-10-11 08:13:18.765388+00', '2025-10-11 08:13:18.765388+00');
INSERT INTO public.users VALUES ('程刚', '$2b$12$JlkeYffE/Bw4vLmMnuOCeuURZIIO4gKZyaMWYWsXZrRz0af.L6x2K', 'workshop', 19, '2025-10-11 08:13:32.019475+00', '2025-10-11 08:13:32.019475+00');
INSERT INTO public.users VALUES ('李斌', '$2b$12$27eiduMysBb0D7nZx6.Pou174baIpcTC8GUmrNrX112XgRmKli5/.', 'workshop', 20, '2025-10-11 08:13:41.400221+00', '2025-10-11 08:13:41.400221+00');
INSERT INTO public.users VALUES ('杨宇涛', '$2b$12$mphJviiaiHXne9AYdaxciO0BZUIHoiLCVkWks.nCZCZgy2sIfc/WG', 'designer', 21, '2025-10-11 08:26:33.860201+00', '2025-10-11 08:26:33.860201+00');
INSERT INTO public.users VALUES ('陈朝西', '$2b$12$3T1zqMI0oe580DvQ15YLwuRk7Q1DpG1ld5hKtO0sotEnhv9nZDBFW', 'designer', 22, '2025-10-11 08:27:11.331049+00', '2025-10-11 08:27:11.331049+00');
INSERT INTO public.users VALUES ('陈朝西1', '$2b$12$0aL1eYP4OI6ZBsEfgX5s8ucw.iagzoIKiH2/JG6bF9v.nSWEJRsUG', 'manager', 23, '2025-10-11 08:27:28.392173+00', '2025-10-11 08:27:28.392173+00');
INSERT INTO public.users VALUES ('姜恩梦', '$2b$12$mtqnMyBA8CO67cyt2Y4x9.3thxyvwk7pVTGuYN.xltyostVd6Myg2', 'salesperson', 24, '2025-10-11 08:27:57.556164+00', '2025-10-11 08:27:57.556164+00');
INSERT INTO public.users VALUES ('高莎', '$2b$12$NErRiY6K7Q4EGoe52z4d5OZdZrD3chPSKjzto84tzwiAROTnzksuO', 'salesperson', 25, '2025-10-11 08:28:09.884226+00', '2025-10-11 08:28:09.884226+00');


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 71, true);


--
-- Name: production_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_progress_id_seq', 16, true);


--
-- Name: productions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.productions_id_seq', 5, true);


--
-- Name: progresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.progresses_id_seq', 276, true);


--
-- Name: split_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.split_progress_id_seq', 34, true);


--
-- Name: splits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.splits_id_seq', 14, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: production_progress production_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_progress
    ADD CONSTRAINT production_progress_pkey PRIMARY KEY (id);


--
-- Name: productions productions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productions
    ADD CONSTRAINT productions_pkey PRIMARY KEY (id);


--
-- Name: progresses progresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progresses
    ADD CONSTRAINT progresses_pkey PRIMARY KEY (id);


--
-- Name: split_progress split_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split_progress
    ADD CONSTRAINT split_progress_pkey PRIMARY KEY (id);


--
-- Name: splits splits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.splits
    ADD CONSTRAINT splits_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_categories_id ON public.categories USING btree (id);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_orders_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: ix_production_progress_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_production_progress_id ON public.production_progress USING btree (id);


--
-- Name: ix_production_progress_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_production_progress_order_number ON public.production_progress USING btree (order_number);


--
-- Name: ix_production_progress_production_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_production_progress_production_id ON public.production_progress USING btree (production_id);


--
-- Name: ix_productions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_productions_id ON public.productions USING btree (id);


--
-- Name: ix_productions_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_productions_order_number ON public.productions USING btree (order_number);


--
-- Name: ix_progresses_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_progresses_id ON public.progresses USING btree (id);


--
-- Name: ix_split_progress_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_split_progress_id ON public.split_progress USING btree (id);


--
-- Name: ix_split_progress_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_split_progress_order_number ON public.split_progress USING btree (order_number);


--
-- Name: ix_split_progress_split_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_split_progress_split_id ON public.split_progress USING btree (split_id);


--
-- Name: ix_splits_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_splits_id ON public.splits USING btree (id);


--
-- Name: ix_splits_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_splits_order_number ON public.splits USING btree (order_number);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: production_progress production_progress_production_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_progress
    ADD CONSTRAINT production_progress_production_id_fkey FOREIGN KEY (production_id) REFERENCES public.productions(id);


--
-- Name: productions productions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productions
    ADD CONSTRAINT productions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: progresses progresses_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progresses
    ADD CONSTRAINT progresses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: split_progress split_progress_split_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split_progress
    ADD CONSTRAINT split_progress_split_id_fkey FOREIGN KEY (split_id) REFERENCES public.splits(id);


--
-- Name: splits splits_order_number_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.splits
    ADD CONSTRAINT splits_order_number_fkey FOREIGN KEY (order_number) REFERENCES public.orders(order_number);


--
-- PostgreSQL database dump complete
--

\unrestrict Se0L9hstfaNxwawZrtdbsLZurIuX3m2xwAdYW4myQEJohnODo6egYk6JZxUSikf

