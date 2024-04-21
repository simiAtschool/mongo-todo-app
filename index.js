const fastify = require("fastify")({ logger: false });
const { MongoClient, ObjectId } = require('mongodb');

// Adress of the mongo container, when start DB is in the container and the app is in the host
console.log(process.env.MONGO_URI);
let uri = process.env.MONGO_URI + "tododb?authSource=admin";
const client = new MongoClient(uri);
client.connect();

async function findAllTodos(client) {
  const result = client.db("tododb").collection("todos").aggregate();

  if (result) {
    console.log(result);
    return result.toArray();
  }
}

async function insertTodo(client, todo) {
  const allowed = ['title', 'description', 'isDone'];

  const filtered = Object.keys(todo)
    .filter(key => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = todo[key];
      return obj;
    }, {});

  if (Object.keys(filtered).length !== 3) {
    throw new Error("Invalid todo");
  }

  const result = await client.db("tododb").collection("todos").insertOne(filtered);
  if (result) {
    console.log(result);
    return result;
  }
}

async function updateTodo(client, id) {
  const result = await client.db("tododb").collection("todos").updateOne({_id: new ObjectId(id)}, {$set: {isDone: true}});
  if (result) {
    console.log(result);
    return result;
  }
}

async function deleteTodo(client, id) {
  const result = await client.db("tododb").collection("todos").deleteOne({_id: new ObjectId(id)});
  if (result) {
    console.log(result);
    return result;
  }
}

// Declare a route
fastify.get("/todos", async () => {
  return await findAllTodos(client);
});

fastify.post("/todos", async (request) => {
  const todo = await insertTodo(client, request.body);
  return todo;
});

fastify.delete("/todos/:id", async (request, reply) => {
  await deleteTodo(client, request.params.id);
  reply.code(204);
  reply.send();
});

fastify.patch("/todos/:id", async (request, reply) => {
  await updateTodo(client, request.params.id);
  reply.code(204);
  reply.send();
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(8080, "0.0.0.0");
    // fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
