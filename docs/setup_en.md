# Preparing the project to launch

## Installing

- Clone this repository:

```bash
git clone https://github.com/shadowplay1/tests-app
```
or download it as ZIP archive.


### On Windows:
- Run the `./scripts/install.ps1` file as Administrator.

### On Linux:
- Run the `./scripts/install.sh` file.

> The script will install Node.js, all project dependencies and create the `.env` file so you could fill all the secrets in.


# Setting Up the Secrets

## Setting up the Database
This project is using the **MongoDB** database. Here's the complete guide on how to create the **MongoDB cluster** and get the cluster `URI` to connect.

1. Create an account on [MongoDB](https://mongodb.com) website.

2. After logging in, click "Create a new cluster".

3. Choose the plan, setup the cluster and then click "Create Cluster" after finishing the setup.

4. Wait until the cluster will be live. It will take several minutes.

5. When cluster is live, go to "Clusters" in the left menu. Find your cluster and click "Connect".

6. Choose the connection method. You many choose "Connect your application" to get the connection URI.

7. Choose the programming language and driver version, then copy the connection URI.

8. Paste the copied connection URI into `MONGODB_URI` field in `.env` file.


## Setting up Emailing
Sending emails is important in account manipulations, such as **account verifying** or **changing the password**. Here's the complete guide on how to get the Gmail application password to send emails.

1. Log in to your Gmail account and go to your [Google security settings page](https://myaccount.google.com/security).

2. Under the "Signing in to Google" section, click on "App passwords".

3. If prompted, enter your Google account password.

4. Select "Mail" as the app and "Other (Custom name)" as the device.

5. Enter a custom name for your app, such as "my_app".

6. Click on "Generate".

7. Copy the generated 16-digit application password.

8. Insert your Gmail email that used to create the password into `MAILER_EMAIL` field in `.env` file.

9.  Paste the generated 16-digit application password into `MAILER_PASSWORD` field in `.env` file.


# Launching

## Development Server
Run `scripts/start.sh` file (for Linux) or `scripts/start.ps1` file (for Windows) to start the development server.

- Visit [https://localhost:3000](https://localhost:3000) after launching the server to see the website running.
