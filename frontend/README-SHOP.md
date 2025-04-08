# Shop Feature Documentation

## Overview
The Shop feature is an e-commerce solution for gym owners to sell products directly to their members. It allows gym owners to list supplements, gym wear, equipment, and accessories through an easy-to-use interface.

## Features

### Admin Side
- **Product Management**: Create, view, edit, and delete products
- **Image Management**: Upload and manage multiple product images
- **Featured Products**: Mark products as featured to highlight them
- **Category Organization**: Organize products by categories
- **Inventory Tracking**: Keep track of product stock and sales

### Technical Implementation

#### 1. Data Models
- `Product`: Represents a product with properties like name, description, price, inventory, etc.
- `ProductImage`: Represents images associated with products
- `ProductReview`: Represents member reviews of products
- `Order`: Represents member orders

#### 2. Pages Created
- `/shop`: Main shop management page for viewing all products
- `/shop/add-product`: Page for adding new products
- `/shop/products/:id`: Page for viewing product details
- `/shop/products/:id/edit`: Page for editing existing products

#### 3. Components
- Product listing with filtering and search
- Image carousel for product images
- Form for adding/editing products
- Review display section

## Usage

### Adding a Product

1. Navigate to the Shop page via the sidebar
2. Click "Add New Product" button
3. Fill out the product details form:
   - Name, description, price
   - Category selection
   - Upload product images
   - Set inventory quantity
   - Optionally mark as featured
4. Click "Create Product" to save

### Managing Products

- **View Products**: All products are displayed on the main Shop page
- **Edit Product**: Click the "Edit" button on a product card
- **Delete Product**: Click the "Delete" button on a product card
- **Toggle Featured Status**: Click the "Feature/Unfeature" button

### Image Management
- Upload multiple images per product
- Set a featured image that will be displayed prominently
- Remove images as needed
- Preview images in a carousel

## Backend Integration

The Shop feature integrates with the following API endpoints:

- `GET /products`: Fetch all products (with optional category filter)
- `GET /products/:id`: Fetch a specific product
- `POST /products`: Create a new product
- `PUT /products/:id`: Update an existing product
- `DELETE /products/:id`: Delete a product
- `PATCH /products/:id/feature`: Toggle a product's featured status

## Future Enhancements

1. **Member Shop View**: Create a frontend for members to browse and purchase products
2. **Shopping Cart**: Implement a cart system for members to collect items before checkout
3. **Payment Integration**: Add payment gateway integration for online purchases
4. **Order Management**: Dashboard for tracking and managing orders
5. **Discounts & Promotions**: System for creating special offers and discount codes
6. **Analytics**: Sales reports and product performance metrics 