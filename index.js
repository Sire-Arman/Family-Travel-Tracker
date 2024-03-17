import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "First",
  password: "870742@aA",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [];
async function getuser(){
  const result = await db.query("select * from users");
  users = result.rows;

  // console.log(result.rows);
  // result.rows.forEach((user) => {users.push(user)});
  // console.log(users)
  // console.log(users.find ((user) => user.id == currentUserId))
  return users.find ((user) => user.id == currentUserId)
  // return users;
}
async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries join users on user_id = users.id where user_id = $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  // console.log(countries)
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getuser();
  // console.log(currentUserId)
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getuser();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  }
  else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;
   const result = await db.query("INSERT into users (name,color) values ($1 , $2) returning *" ,[name, color]);
   currentUserId = result.rows[0].id;
   res.redirect("/");

  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
