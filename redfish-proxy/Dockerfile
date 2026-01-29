FROM nginx:alpine

# Install required tools
RUN apk add --no-cache openssl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for dynamic upstream configs
RUN mkdir -p /etc/nginx/conf.d

EXPOSE 8443

CMD ["nginx", "-g", "daemon off;"]
