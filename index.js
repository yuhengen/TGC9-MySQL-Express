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
  app.get('/cities', async (req,res) => {
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

app.get('/films', async (req,res) => {

    let [results] = await connection.execute(`SELECT * FROM film`)

    res.render('films.hbs', {
        'films': results
    })
})

app.get('/films/create', async (req,res) => {
    let [languages] = await connection.execute(`SELECT * FROM language`)
    res.render('create_film', {
        'languages':languages
    })
})

app.post('/films/create', async(req,res) =>{
    //   res.send(req.body);
    // traditional method
    // let title = req.body.title;
    // let description = req.body.description;
    // let release_year = req.body.release_year;
    // let language_id = req.body.language_id;
    // let rental_duration = req.body.language_id;
    // let replacement_cost = req.body.replacement_cost;

    // OR use the modern method (object destructuring)
    let {
      title,
      description,
      release_year,
      language_id,
      rental_duration,
      replacement_cost,
      actor_id
    } = req.body;

    let [results] = await connection.execute(
      `
        insert into film 
        ( title, description, release_year, language_id, rental_duration, replacement_cost)
        values (?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        release_year,
        language_id,
        rental_duration,
        replacement_cost,
      ]
    );

    // get the film_id of the film we just created
    let newFilmId = results.insertId;

    for (let eachActor of actor_id) {
        connection.execute(`insert into film_actor (actor_id, film_id)
            values (?, ?)`, [
                eachActor, newFilmId
            ])
    }

    res.redirect('/films');
});

app.get('/films/:film_id/update', async (req,res) => {
      let wanted_film_id = req.params.film_id;
      let [films] = await connection.execute("select * from film where film_id= ?", [wanted_film_id]);
      let wanted_film = films[0];

      let [languages] = await connection.execute("select * from language");

      // Actors
      let [actors] = await connection.execute("select * from actor");
      let [existing_actors] = await connection.execute('select actor_id from film_actor where film_id=?', [wanted_film_id])

      let existing_actor_ids = [];
      for (let a of existing_actors) {
          existing_actor_ids.push(a.actor_id);
      }
    //   console.log(existing_actor_ids);

      // Categories
      let [category] = await connection.execute("SELECT * FROM category");
      let [existing_category] = await connection.execute("SELECT category_id FROM film_category where film_id=?", [wanted_film_id]);

      let existing_category_id = [];
      for (let c of existing_category) {
          existing_category_id.push(c.category_id);
      }
    //   console.log(existing_category_id);

      return res.render('update_film', {
          'wanted_film': wanted_film,
          'languages': languages,
          'actors': actors,
          'existing_actors': existing_actor_ids,
          'category': category,
          'existing_category': existing_category_id
      })

  })

  app.post('/films/:film_id/update', async (req, res)=>{
      console.log("UPDATING FILM");
      console.log(req.params.film_id);
    
    // Actors
    let [existing_actors] = await connection.execute('select actor_id from film_actor where film_id = ?', [req.params.film_id]);

    let existing_actor_ids = existing_actors.map( a => a.actor_id);  
    let new_actor_ids = req.body.actor_id;
    // console.log(existing_actor_ids);
    // console.log(new_actor_ids); 

    // Categories
    let [existing_category] = await connection.execute('SELECT category_id from film_category WHERE film_id = ?', [req.params.film_id]);

    let existing_category_id = existing_category.map(c => c.category_id);
    let new_category_id = req.body.category_id;
    // console.log(existing_category_id);
    // console.log(new_category_id);

    try {
        await connection.beginTransaction();

        // Actors comparison
        for (let id of existing_actor_ids) {
            if (new_actor_ids.includes(id + "") == false) {
                let sql = `delete from film_actor where film_id=${req.params.film_id} AND actor_id=${id}`;
                // console.log(sql);
                connection.execute("delete from film_actor where film_id=? AND actor_id=?",[
                    req.params.film_id, id
                ])
            }
        }

        for (let id of new_actor_ids) {
            if (existing_actor_ids.includes(parseInt(id)) == false) {
                connection.execute(`insert into film_actor (film_id, actor_id) values (?, ?)`, [
                    req.params.film_id, id
                ])
            }
        }

        // Category comparison
        for (let cat_id of existing_category_id) {
            if (new_category_id.includes(cat_id+"") == false) {
                let cat_sql = `DELETE FROM film_category WHERE film_id=${req.params.film_id} AND category_id=${cat_id}`;
                // console.log(cat_sql);
                connection.execute("DELETE FROM film_category WHERE film_id=? AND category_id=?", [req.params.film_id,cat_id]);
            }
        }

        for (let cat_id of new_category_id) {
            if (existing_category_id.includes(parseInt(cat_id)) == false) {
                connection.execute(`INSERT INTO film_category (film_id, category_id) values (?,?)`, [req.params.film_id, cat_id]);
            }
        }

        // Easy way for update


        await connection.execute(`update film set title=?,
                                              description=?,
                                              release_year=?,
                                              language_id=?,
                                              rental_duration=?,
                                              replacement_cost=?
                                              where film_id = ?`,[
                                                  req.body.title,
                                                  req.body.description,
                                                  req.body.release_year,
                                                  req.body.language_id,
                                                  req.body.rental_duration,
                                                  req.body.replacement_cost,
                                                  req.params.film_id     
                                              ])


        await connection.commit();
        res.redirect('/films')
    } catch (e) {
        console.log(e);
        connection.rollback();
        res.send(e);
    }
 
})

} // END MAIN

main();

app.listen(3000, () => {
  console.log("Server started");
});
