Backend (/server) Structure:

routes/: Defines your endpoints (e.g., productRoutes.js).

controllers/: Contains the logic for what happens at those endpoints (e.g., calling Firebase).

models/: Defines the data shapes (Compatibility Schema).

middleware/: Handles things like authentication or validation.

HTTP request
↓
server.js → mounts routes
↓
routes → defines URL + method
↓
controller → business logic + response
