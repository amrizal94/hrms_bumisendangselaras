FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Create system user to run Composer and Artisan Commands
RUN groupadd -g 1000 www && useradd -u 1000 -ms /bin/bash -g www www

# Ensure writable directories exist with correct ownership
RUN mkdir -p /var/www/html/storage/framework/{cache/data,sessions,views} \
    && mkdir -p /var/www/html/storage/{app/public,logs} \
    && mkdir -p /var/www/html/bootstrap/cache \
    && chown -R www:www /var/www/html

# Change current user to www
USER www

EXPOSE 9000
CMD ["php-fpm"]
