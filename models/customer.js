/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get a customer by name. */

  static async getByName(search) {
    const searchArr = search.split(" ");
    
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers 
        WHERE first_name=$1 OR last_name=$2 OR first_name=$2 OR last_name=$1`,
      [searchArr[0], searchArr[1]]
    );
    console.log("query results", results.rows)

    const customer = results.rows;

    if (customer === undefined) {
      const err = new Error(`No such customer: ${firstName} ${lastName}`);
      err.status = 404;
      throw err;
    }

    return results.rows.map(c => new Customer(c));
  }


  /** get first and last name */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /**get top 10 customers by reservations count */

  static async getTopTenCusts() {
    const results = await db.query(
          `SELECT
          reservations.customer_id AS "customerId", 
          customers.first_name AS "firstName",  
          customers.last_name AS "lastName", 
          customers.phone, 
          customers.notes,
          COUNT(reservations.customer_id) AS resCount
          FROM reservations
          LEFT JOIN customers
          ON reservations.customer_id = customers.id
          GROUP BY reservations.customer_id,
          customers.first_name,
          customers.last_name,
          customers.phone, 
          customers.notes
          ORDER BY COUNT(reservations.customer_id) DESC 
          LIMIT 10`
    );

    // console.log("top ten results", results.rows)

    return results.rows.map(row => new Customer(row));
  }
}

module.exports = Customer;
