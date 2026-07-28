# PHP && Apache image
FROM php:8.2-apache

# Set working directory
WORKDIR /var/www/html

# Install system dependencies first
RUN apt-get update && apt-get install -y libpq-dev nodejs npm && rm -rf /var/lib/apt/lists/*

# Enable required Apache modules BEFORE copying vhost
RUN a2enmod rewrite headers proxy proxy_http

# Configuration & Permissions
COPY ./apache/vhost.conf /etc/apache2/sites-available/000-default.conf
RUN a2ensite 000-default.conf

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql

# Copy application source
COPY ./ /var/www/html/

# Ensure Apache can read static assets and application files
RUN chown -R www-data:www-data /var/www/html && find /var/www/html -type d -exec chmod 755 {} \; && find /var/www/html -type f -exec chmod 644 {} \;

# Build client-side code
RUN npm install -g typescript && tsc --build

# Expose port 80
EXPOSE 80

# Start Apache in foreground
CMD ["apache2-foreground"]
