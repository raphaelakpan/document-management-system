import jwt from 'jsonwebtoken';
import db from '../models';

/**
 * Secret token for jsonwebtoken
 */
const secret = process.env.SECRET || 'my secret key';

const usersController = {
  /**
   * Login a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  login(req, res) {
    db.User.findOne({ where: { email: req.body.email } })
      .then((user) => {
        if (user && user.validatePassword(req.body.password)) {
          const token = jwt.sign({ userId: user.id, roleId: user.roleId },
          secret, { expiresIn: '1 day' });
          return res.status(200).send({ token, user });
        }

        res.status(401)
            .send({ message: 'Invalid Login Details!' });
      });
  },

   /**
   * Logout a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  logout(req, res) {
    res.status(200)
      .send({ message: 'Successfully logged out!' });
  },

 /**
   * Create a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  create(req, res) {
    db.User.findOne({ where: { email: req.body.email } })
      .then((existingUser) => {
        if (existingUser) {
          return res.status(400).send({
            message: 'Oops! A user already exists with this email'
          });
        }

        db.User
          .create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password,
            roleId: 2,
          })
          .then((user) => {
            const token = jwt.sign({ userId: user.id, roleId: user.roleId },
            secret, { expiresIn: '1 day' });
            res.status(201).send({ token, user });
          })
          .catch(error => res.status(400).send(error));
      });
  },

   /**
   * List all users
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  list(req, res) {
    const query = {};
    query.limit = (req.query.limit > 0) ? req.query.limit : 10;
    query.offset = (req.query.offset > 0) ? req.query.offset : 0;
    query.attributes = { exclude: ['password'] };
    db.User
      .findAndCountAll(query)
      .then(users => res.status(200).send({
        users: users.rows, count: users.count
      }));
  },

   /**
   * Retrive a user's details
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  retrieveUser(req, res) {
    db.User
      .findById(req.params.id, {
        attributes : { exclude: ['password'] }
      })
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'User Not Found',
          });
        }
        if (req.decoded.isAdmin || req.decoded.userId === user.id) {
          res.status(200).send(user);
        } else {
          res.status(403)
            .send({ message: 'You can only retrieve your information!' });
        }
      })
      .catch(error => res.status(400).send(error));
  },

   /**
   * Retrieve a user's details with documents owned by the user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  retrieveDocuments(req, res) {
    db.User
      .findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'User Not Found',
          });
        }

        if (req.decoded.isAdmin || req.decoded.userId === user.id) {
          const query = {
            where: { ownerId: user.id}
          };
          query.limit = (req.query.limit > 0) ? req.query.limit : 10;
          query.offset = (req.query.offset > 0) ? req.query.offset : 0;
          db.Document
            .findAndCountAll(query)
            .then(documents => res.status(200).send({
              documents: documents.rows,
              count: documents.count
            }));
        } else {
          res.status(403).send({
            message: 'You are not authorized to access this document(s)'
          });
        }
      })
      .catch(error => res.status(400).send(error));
  },

   /**
   * Update a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  updateUser(req, res) {
    db.User
      .findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'User Not Found',
          });
        }

        if (req.decoded.isAdmin || req.decoded.userId === user.id) {
          user
            .update(req.body, { fields: Object.keys(req.body) })
            .then(updatedUser => res.status(200).send({
              message: 'User updated successfully'
            }));
        } else {
          res.status(403)
            .send({ message: 'You are not authorized to update this user' });
        }
      })
      .catch(error => res.status(400).send(error));
  },

   /**
   * Delete a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response object
   */
  deleteUser(req, res) {
    db.User
      .findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'User Not Found',
          });
        }

        if (Number(req.params.id) === 1) {
          return res.status(403)
            .send({ message: 'You cannot delete default admin user account!' });
        }

        user
          .destroy()
          .then(() => res.status(200).send({
            message: 'User deleted successfully.',
          }));
      })
      .catch(error => res.status(400).send(error));
  },
};

export default usersController;
