const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
const fs = require("fs"); // import in the file system
const mysql = require("mysql2/promise");

let app = express();
// set which view engine to use
app.set("view engine", "hbs");

// set where to find the static files
app.use(express.static("public"));

// setup wax on for template inheritance
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// setup forms
app.use(
  express.urlencoded({
    extended: false,
  })
);

const helpers = require("handlebars-helpers")({
  handlebars: hbs.handlebars,
});

async function main() {
  // createConnection is an asynchronous procedure so we need to AWAIT
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "sakila",
  });

  // Display Actor
  app.get("/", async (req, res) => {
    // Connection.execute is asynchronous, require AWAIT
    let [actors] = await connection.execute("SELECT * from actor");
    res.render("actors.hbs", {
      actors: actors,
    });
  });

  // Create Actor
  app.get("/actor/create", async (req, res) => {
    res.render("create_actor.hbs");
  });

  app.post("/actor/create", async (req, res) => {
    let firstName = req.body.first_name;
    let lastName = req.body.last_name;

    await connection.execute(
      `INSERT into actor (first_name, last_name)
      values (?, ?)`,
      [firstName, lastName]
    );

    res.redirect("/");
  });

  // Update Actor
  app.get("/actor/:actor_id/update", async (req, res) => {
    let [
      actors,
    ] = await connection.execute("SELECT * from actor WHERE actor_id = ?", [
      req.params.actor_id,
    ]);

    let theActor = actors[0];

    res.render("edit_actor.hbs", {
      actor: theActor,
    });
  });

  app.post("/actor/:actor_id/update", async (req, res) => {
    let firstName = req.body.first_name;
    let lastName = req.body.last_name;
    let actorId = req.params.actor_id;

    await connection.execute(
      `UPDATE actor set first_name = ?, last_name =?
      WHERE actor_id = ?`,
      [firstName, lastName, actorId]
    );

    res.redirect("/");
  });

  // Delete Actor
  app.get("/actor/:actor_id/delete", async (req, res) => {
    let actorToDelete = req.params.actor_id;

    let [
      actors,
    ] = await connection.execute(`SELECT * from actor WHERE actor_id = ?`, [
      actorToDelete,
    ]);
    let theActor = actors[0];

    res.render("delete_actor.hbs", {
      actor: theActor,
    });
  });

  app.post("/actor/:actor_id/delete", async (req, res) => {
    let actor_id = req.params.actor_id;
    await connection.execute(`DELETE from actor where actor_id = ?`, [
      actor_id,
    ]);
    res.redirect("/");
  });

  // Display Languages
  app.get("/languages", async (req, res) => {
    let [languages] = await connection.execute("SELECT * from language");
    res.render("languages.hbs", {
      'languages': languages,
    });
  });

  // Create Languages
  app.get("/language/create", async(req,res) => {
      res.render("languages/create_language.hbs")
  })

  app.post("/language/create", async (req,res) => {
      let language = req.body.language;
      
      await connection.execute(`INSERT into language (name) values (?)`, [language]);

      res.redirect("/languages");
  })

  app.get("/countries", async (req, res) => {
    let [countries] = await connection.execute("SELECT * from country");
    // Use this to test
    //   res.send(countries);
    res.render("countries.hbs", {
      countries,
    });
  });

  // Create Countries
  app.get("/countries/create", async (req, res) => {
    res.render("create_country.hbs");
  });

  app.post("/countries/create", async (req, res) => {
    let country = req.body.country;

    await connection.execute(`INSERT into country (country) values (?)`, [
      country,
    ]);

    res.redirect("/countries");
  });

  // Update Countries
  app.get("/countries/:country_id/update", async (req,res) => {
      let [countries] = await connection.execute(`SELECT * FROM country WHERE country_id = ?`, [req.params.country_id]);

      let selectedCountry = countries[0]
      res.render("edit_country.hbs", {
          'country': selectedCountry
      });
    // res.send(countries);
  });

  app.post("/countries/:country_id/update", async (req,res) => {
      let country = req.body.country;
      let countryID = req.params.country_id;

      await connection.execute(`UPDATE country SET country = ? WHERE country_id = ?`, [country,countryID]);

      res.redirect("/countries")
  })

  // Delete Countries
  app.get('/countries/:country_id/delete', async (req,res) => {
      let [countries] = await connection.execute(`SELECT * FROM country WHERE country_id = ?`, [req.params.country_id]);

      let selectedCountry = countries[0];
      res.render("delete_country.hbs", {
          'country':selectedCountry
      });
  });

  app.post('/countries/:country_id/delete', async(req,res)=> {
      let countryID = req.params.country_id;
      await connection.execute(`DELETE from country WHERE country_id = ?`, [countryID]);

      res.redirect('/countries');
  })

  // Display Cities
  app.get('/city', async (req,res) => {
      let [city] = await connection.execute(`SELECT * FROM city JOIN country ON city.country_id = country.country_id`)

      res.render('cities.hbs', {
          city
      })
  })

  // Update Cities
  app.get('/city/:city_id/update', async (req,res) => {
      let [countries] = await connection.execute('SELECT * from country');
      let wantedCityID = req.params.city_id;
      let [cities] = await connection.execute('SELECT * FROM city WHERE city_id = ?', [wantedCityID]);
      let theCity = cities[0];
      res.render('edit_city', {
          countries,
          theCity
      })
  })

  // Display Stores
  app.get("/stores", async (req, res) => {
    let [
      stores
    ] = await connection.execute(`SELECT store.store_id, address.address, staff.first_name, staff.last_name from store
    JOIN address
    ON store.address_id = address.address_id
    JOIN staff
    ON store.manager_staff_id = staff.staff_id`);
    //   res.send(stores)
    res.render("stores.hbs", {
      stores
    });
  });
}

main();

app.listen(3000, () => {
  console.log("Server started");
});
