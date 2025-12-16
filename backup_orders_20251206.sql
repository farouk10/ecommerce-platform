--
-- PostgreSQL database dump
--

\restrict Nc1si942RJmsIVBlZISZwIh1fUPpnLOUPCTvnplnV9cKkOxUF9uVTHCYPFe4XBZ

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: ecommerce
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO ecommerce;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: ecommerce
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    product_name character varying(255),
    quantity integer NOT NULL,
    price_at_purchase numeric(38,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO ecommerce;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: ecommerce
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO ecommerce;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecommerce
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: ecommerce
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    order_number character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    shipping_address character varying(500) NOT NULL,
    payment_method character varying(255) DEFAULT 'CREDIT_CARD'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    promo_code character varying(255),
    discount numeric(10,2)
);


ALTER TABLE public.orders OWNER TO ecommerce;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: ecommerce
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO ecommerce;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecommerce
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init schema	SQL	V1__init_schema.sql	-494392896	ecommerce	2025-12-04 19:18:38.760591	37	t
2	2	add promo fields	SQL	V2__add_promo_fields.sql	-246677077	ecommerce	2025-12-04 19:18:38.817759	3	t
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

COPY public.order_items (id, order_id, product_id, product_name, quantity, price_at_purchase) FROM stdin;
1	1	1	iPhone 16 Pro	1	1299.99
2	1	2	MacBook Pro M4	1	2999.99
3	2	1	iPhone 16 Pro	1	1299.99
4	3	1	iPhone 16 Pro	1	1299.99
5	4	1	iPhone 16 Pro	1	1299.99
6	5	1	iPhone 16 Pro	1	1299.99
7	6	1	iPhone 16 Pro	1	1299.99
8	7	1	iPhone 16 Pro	1	1299.99
9	8	1	iPhone 16 Pro	1	1299.99
10	9	1	Test	1	100.00
11	10	1	iPhone 16 Pro	1	1299.99
12	11	1	iPhone 16 Pro	1	1299.99
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

COPY public.orders (id, user_id, order_number, status, total_amount, shipping_address, payment_method, created_at, updated_at, promo_code, discount) FROM stdin;
1	john@example.com	ORD-1764872918280	PENDING	2149.99	123 Main St, New York, NY 10001	CREDIT_CARD	2025-12-04 19:28:38.345373	2025-12-04 19:28:38.3454	VIP50	2149.99
2	john@example.com	ORD-1764875118732	PENDING	1099.99	FINAL TEST ADDRESS	CREDIT_CARD	2025-12-04 20:05:18.75393	2025-12-04 20:05:18.75394	SAVE20	200.00
3	john@example.com	ORD-1764880171675	PENDING	1099.99	123 Main St, New York, NY 10001	CREDIT_CARD	2025-12-04 21:29:31.68844	2025-12-04 21:29:31.688456	SAVE20	200.00
4	john@example.com	ORD-1764880349107	PENDING	1099.99	123 Main St, New York, NY 10001	CREDIT_CARD	2025-12-04 21:32:29.109541	2025-12-04 21:32:29.109551	SAVE20	200.00
5	john@example.com	ORD-1764880414729	PENDING	1099.99	FINAL TEST ADDRESS	CREDIT_CARD	2025-12-04 21:33:34.731207	2025-12-04 21:33:34.731218	SAVE20	200.00
6	john@example.com	ORD-1764881513804	PENDING	1099.99	FINAL TEST ADDRESS	CREDIT_CARD	2025-12-04 21:51:53.817828	2025-12-04 21:51:53.817836	SAVE20	200.00
7	john@example.com	ORD-1764881560781	PENDING	1099.99	123 Broadway, NYC	CREDIT_CARD	2025-12-04 21:52:40.783292	2025-12-04 21:52:40.783304	SAVE20	200.00
8	john@example.com	ORD-1764881597911	PENDING	1099.99	789 5th Ave, NYC	CREDIT_CARD	2025-12-04 21:53:17.921196	2025-12-04 21:53:17.921207	SAVE20	200.00
9	john@example.com	ORD-1764883197099	PENDING	80.00	TEST	CARD	2025-12-04 22:19:57.109751	2025-12-04 22:19:57.109759	SAVE20	20.00
10	john@example.com	ORD-1765022153546	PENDING	1099.99	123 Rue de la Paix, 75001 Paris, France	CREDIT_CARD	2025-12-06 12:55:53.572306	2025-12-06 12:55:53.572322	SAVE20	200.00
11	59a33838-a04c-460b-a61d-d9f0c6669e64	ORD-1765025670224	PENDING	1099.99	123 Rue de la Paix, 75001 Paris, France	CREDIT_CARD	2025-12-06 13:54:30.251373	2025-12-06 13:54:30.251415	SAVE20	200.00
\.


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecommerce
--

SELECT pg_catalog.setval('public.order_items_id_seq', 12, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecommerce
--

SELECT pg_catalog.setval('public.orders_id_seq', 11, true);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_created_at; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_order_created_at; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_created_at ON public.orders USING btree (created_at DESC);


--
-- Name: idx_order_item_order_id; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_item_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_item_product_id; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_item_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_order_item_product_order; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_item_product_order ON public.order_items USING btree (product_id, order_id);


--
-- Name: idx_order_number; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_number ON public.orders USING btree (order_number);


--
-- Name: idx_order_status; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_status ON public.orders USING btree (status);


--
-- Name: idx_order_user_created; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_user_created ON public.orders USING btree (user_id, created_at DESC);


--
-- Name: idx_order_user_id; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_order_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_promo_code; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_promo_code ON public.orders USING btree (promo_code);


--
-- Name: idx_status; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_status ON public.orders USING btree (status);


--
-- Name: idx_user_id; Type: INDEX; Schema: public; Owner: ecommerce
--

CREATE INDEX idx_user_id ON public.orders USING btree (user_id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecommerce
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Nc1si942RJmsIVBlZISZwIh1fUPpnLOUPCTvnplnV9cKkOxUF9uVTHCYPFe4XBZ

