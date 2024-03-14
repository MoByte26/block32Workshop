const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_icecream_db')
const express = require('express');
const app = express();
const path = require('path');

// *******************************************************************************************

// parse the body into JS Objects
app.use(express.json());

// *******************************************************************************************

// Log the requests as they come in
app.use(require('morgan')('dev'));

// *******************************************************************************************

// GET - returns array of flavors
app.get('/api/flavors', async(req, res, next)=> {
    try {
        const SQL = `
        SELECT * from flavors ORDER BY created_at DESC;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } 
    catch (ex) {
        next(ex);
    }
});

// *******************************************************************************************

// GET - returns a single flavor
app.get('/api/flavors/:id', async(req, res, next)=> {
    try {
        const SQL = `
        SELECT * from flavors WHERE id =$1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows[0]);
    } 
    catch (ex) {
        next(ex);
    }
});

// *******************************************************************************************

// POST - payload: the flavor to create, returns the created flavor
app.post('/api/flavors', async(req, res, next)=> {
    try {
        const SQL = `
        INSERT INTO flavors(name, is_favorite)
        VALUES($1, $2)
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
        res.send(response.rows[0]);
    } 
    catch (ex) {
        next(ex);
    }
});

// *******************************************************************************************

// DELETE
app.delete('/api/flavors/:id', async (req, res, next)=> {
    try {
        const SQL = `
        DELETE from flavors
        WHERE id = $1
        `;
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204);
    } 
    catch (ex) {
        next(ex);
    }
});

// *******************************************************************************************

// PUT - payload: the updated flavor, returns the updated flavor
app.put('/api/flavors/:id', async(req, res, next)=> {
    try {
        const SQL = `
        UPDATE flavors
        SET name=$1, is_favorite=$2, updated_at= now()
        WHERE id=$3 RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } 
    catch (ex) {
        next(ex);
    }
});

// *******************************************************************************************

// create and run the express app
const init = async()=> {
    await client.connect();
    let SQL = `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        is_favorite BOOLEAN DEFAULT false NOT NULL,
        name VARCHAR(255) NOT NULL
      );
    `;
    await client.query(SQL);
    console.log('tables created');
   SQL = `
        INSERT INTO flavors(name) VALUES('rocky road');
        INSERT INTO flavors(name, is_favorite) VALUES('pecan', true);
        INSERT INTO flavors(name, is_favorite) VALUES('mint', true);
        INSERT INTO flavors(name) VALUES('cotton candy');
        `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  };
  
  init();
  
  
  