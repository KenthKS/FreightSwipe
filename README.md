# FreightSwipe

FreightSwipe is a platform that connects shippers with truckers to facilitate the transportation of goods.

## How to Run the Application

This application uses Docker and Docker Compose to manage its services (PostgreSQL database, Node.js backend, and React frontend).

### Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Docker:** [Install Docker](https://docs.docker.com/get-docker/)
*   **Docker Compose:** Docker Desktop usually includes Docker Compose. If not, [install Docker Compose](https://docs.docker.com/compose/install/)

### Getting Started

1.  **Navigate to the project root directory:**
    Open your terminal or command prompt and navigate to the directory where you cloned this repository.
    ```bash
    cd path/to/your/cloned/FreightSwipe
    ```
    (Replace `path/to/your/cloned/FreightSwipe` with the actual path on your machine.)

2.  **Start the application:**
    This command will build the Docker images (if they haven't been built yet) and start all the services defined in `docker-compose.yml` in detached mode (in the background).

    ```bash
    docker-compose up -d --build
    ```

    *   The first time you run this, it might take a few minutes as Docker downloads images and builds the application.

3.  **Access the Application:**
    *   **Frontend:** Once the services are up and running, you can access the FreightSwipe frontend in your web browser at:
        [http://localhost:3000](http://localhost:3000)
    *   **Backend API:** The backend API will be running on:
        [http://localhost:3001](http://localhost:3001)
    *   **PostgreSQL Database:** The database will be accessible internally within the Docker network on port `5432`.

### Stopping the Application

To stop all running services and remove their containers, networks, and volumes, run the following command from the project root directory:

```bash
docker-compose down -v
```

This will stop and remove all services and the associated `db_data` volume, ensuring a clean shutdown.
