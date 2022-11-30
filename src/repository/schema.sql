CREATE TABLE IF NOT EXISTS ContractLastBlock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address VARCHAR(42) NOT NULL,
    network INTEGER NOT NULL,
    block INTEGER NOT NULL,

    UNIQUE(address,network)
)
