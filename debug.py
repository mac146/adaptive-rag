import json

with open("document_state.json", "r") as f:
    state = json.load(f)

print("Total sections:", len(state["sections"]))
print("\nAll section titles:")
for s in state["sections"]:
    print(repr(s["title"]))