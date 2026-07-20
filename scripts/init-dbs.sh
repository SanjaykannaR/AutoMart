#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE automart_auth;
    CREATE DATABASE automart_products;
    CREATE DATABASE automart_orders;
    CREATE DATABASE automart_inventory;
EOSQL
