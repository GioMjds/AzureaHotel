CREATE DATABASE craveon;

USE craveon;

CREATE TABLE admin(
	admin_id INT AUTO_INCREMENT PRIMARY KEY,
	admin_username VARCHAR(100) NOT NULL,
    admin_password VARCHAR(100) NOT NULL
);

CREATE TABLE users (
	user_id INT AUTO_INCREMENT PRIMARY KEY,
	first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
	email VARCHAR(100) NOT NULL,
	contact VARCHAR(11) NOT NULL,
	address TEXT NOT NULL,
	password VARCHAR(100) NOT NULL,
	is_archived BOOLEAN DEFAULT FALSE,
	status ENUM('Active', 'Inactive') DEFAULT 'Active',
    user_img LONGTEXT NULL,
	hotel_user BOOLEAN DEFAULT FALSE
);


CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE items(
	item_id INT AUTO_INCREMENT PRIMARY KEY,
	item_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
	image LONGBLOB NOT NULL,
	category_id INT,
    is_archived BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE orders(
	order_id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
	status ENUM('Pending', 'Processing', 'Completed', 'Cancelled', 'Reviewed') DEFAULT 'Pending',
	payment_ss LONGTEXT NULL,
	payment_submitted BOOLEAN,
	reviewed BOOLEAN DEFAULT FALSE,
	cancellation_reason TEXT,
	ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	booking_id INT NULL,
	hotel_room_area VARCHAR(100) NULL,
	guest_email VARCHAR(100) NULL,
	guest_name VARCHAR(100) NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_items(
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
	order_id INT ,
	item_id INT,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
	FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);