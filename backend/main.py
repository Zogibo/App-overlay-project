import json # JSON files is the norm for communicating between channels, since Python script
# and Typescipt script can't communicate directly, so they use JSON files instad



print(json.dumps({ #makes shit into JSON formmating
    "envelop": "Greetings",
    "message": "Ciao!"
}), flush=True)