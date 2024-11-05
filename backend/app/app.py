from flask import Flask, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Load JSON data into dictionaries
with open('children.json', 'r') as children_file:
    children_dict = json.load(children_file)

with open('parents.json', 'r') as parents_file:
    parents_dict = json.load(parents_file)

with open('node_data.json', 'r') as node_data_file:
    node_data_dict = json.load(node_data_file)

# Endpoint to retrieve a value by key
@app.route('/get/<key>', methods=['GET'])
def get_value(key):
    # Retrieve children and parents for the given key
    children_keys = children_dict.get(key, [])
    parents_keys = parents_dict.get(key, [])

    # Transform children and parents data

    central = [
        {
            'id': key,
            'label': node_data_dict[key]['descriptor_name'],
            'scopenote': node_data_dict[key]['scope_note']
        }
    ]

    children = [
        {
            'id': child_key,
            'label': node_data_dict[child_key]['descriptor_name'],
            'scopenote': node_data_dict[child_key]['scope_note']
        }
        for child_key in children_keys if child_key in node_data_dict
    ]

    parents = [
        {
            'id': parent_key,
            'label': node_data_dict[parent_key]['descriptor_name'],
            'scopenote': node_data_dict[parent_key]['scope_note']
        }
        for parent_key in parents_keys if parent_key in node_data_dict
    ]

    # Check if the key exists in either dictionary
    if not children and not parents:
        return jsonify({'error': 'MeSH ID not found'}), 404

    return jsonify({
        'central': central,
        'children': children,
        'parents': parents,
    }), 200

if __name__ == '__main__':
    app.run(debug=True)

