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

