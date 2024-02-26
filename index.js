const express = require("express");
const morgan = require("morgan");
const app = express();
const pg = require("pg");

app.use(express.json());
app.use(require("morgan")("dev"));

const client = new pg.Client(
    process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);

//Create Route
app.post("/api/notes", async (req, res, next) => {
    try {
        // Define the SQL query with interpolation
        const SQL = `INSERT INTO notes(txt)VALUES($1)RETURNING *`;

        // Execute the SQL query with the value from req.body.txt
        const response = await client.query(SQL, [req.body.txt]);

        // Send the inserted record as the response
        res.send(response.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Read Route
app.get("/api/notes", async (req, res, next) => {
    try {
        // SELECT all records from our table notes, and we want them ORDERed by when they were created, in DESCending order.
        const SQL = `SELECT * FROM notes ORDER BY created_at DESC;`;

        const response = await client.query(SQL);

        res.send(response.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update Route
app.put("/api/notes/:id", async (req, res, next) => {
    try {
        const SQL = `
        UPDATE notes
        SET txt=$1, ranking=$2, updated_at=now()
        WHERE id=$3
        RETURNING *;
        `;
        // Execute the SQL query with values from req.body and req.params
        const response = await client.query(SQL, [
            req.body.txt,
            req.body.ranking,
            req.params.id,
        ]);
        // Sending the updated record as the response
        res.send(response.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete Route
app.delete("/api/notes/:id", async (req, res, next) => {
    try {
        const SQL = `
        DELETE FROM notes
        WHERE id=$1;
        `;
        // Execute the SQL query with value from req.params
        await client.query(SQL, [req.params.id]);

        // Send a success status code indicating that the item was deleted
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

async function init() {
    try {
        await client.connect();
        console.log("Connected to database 🥳");

        let SQL = `
        DROP TABLE IF EXISTS notes;
          CREATE TABLE notes(
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          ranking INTEGER DEFAULT 3 NOT NULL,
          txt VARCHAR(255) NOT NULL
        );
     `;

        await client.query(SQL);

        console.log("tables created 📊");
        SQL = `
        INSERT INTO notes (txt, ranking) VALUES 
            ('learn express', 5),
            ('write SQL queries', 4),
            ('create routes', 2);
        `;

        await client.query(SQL);
        console.log("Data Seeded ✅");
        // Listening on a port

        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`Listening on port ${port}`));
    } catch (error) {
        console.error(error);
    }
}

init();
