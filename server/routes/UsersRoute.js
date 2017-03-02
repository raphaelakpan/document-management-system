import UsersController from '../controllers/UsersController';
import Authentication from '../middlewares/Authentication';

const UsersRoute = (router) => {
  // Create a new user or get all users
  router.route('/users')
   .post(UsersController.create)
   .get(Authentication.verifyToken, Authentication.verifyAdmin, UsersController.list);

  // Update, delete or get a specific user
  router.route('/users/:id')
    .put(Authentication.verifyToken, Authentication.isAdmin, UsersController.updateUser)
    .get(Authentication.verifyToken, Authentication.isAdmin, UsersController.retrieveUser)
    .delete(Authentication.verifyToken, Authentication.verifyAdmin, UsersController.deleteUser);

  // Get a single user's documents
  router.route('/users/:id/documents')
    .get(Authentication.verifyToken, Authentication.isAdmin, UsersController.retrieveDocuments);

  // Log in a user
  router.route('/users/login')
    .post(UsersController.login);

  // Log out a user
  router.route('/users/logout')
    .post(Authentication.verifyToken, UsersController.logout);
};

export default UsersRoute;