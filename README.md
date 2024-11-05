This project generates an interactive graph that visualizes MeSH terms. The objective is to create a map all known medical knowledge. Left-clicking a node "expands" it by showing all of its child nodes. Right-clicking a node collapses all of its child nodes, so as to prevent excessively cluttering the screen. 

The MeSH database is too massive to show all at once. Therefore, the app uses a Flask API that only sends to the frontend the data that the user wants to display at a given time. Data was obtained from the MeSH database and parsed into json. It is loaded as a hash map for quick retrieval. 

To RUN : 

First make sure you have both Python and Node.js installed on your computer.

Run backend :

```
git clone https://github.com/MarcosQBV/MeshTree

cd MeshTree/backend

python -m venv venv
```

On Windows : Windows:

```
venv\Scripts\activate
```
on macOS/Linux:

```
source venv/bin/activate
```
Then :

```
pip install -r requirements.txt

cd app

python app.py
```

After backend is running, open a new terminal and run the frontend : 

```
cd ../../frontend

npm install

npm start
```

