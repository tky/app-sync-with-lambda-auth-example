# Minimal App Sync with lambda auth Example

This is a minimal App Sync Example using Subscripion and lambda auth.

## Getting Started

### Create AWS resources.

```
$ cd cdk
$ cdk deploy
```

the hotswap is better on development.

```
$ cdk watch --hotswap
```

### Mutate

Get API URL from a AWS AppSync Settings and put it to an environmental variable.

```
$ export API_ENDPOINT="<API_URL>"
```

Put a query and exceute to use [gq](https://github.com/hasura/graphqurl).

```
export QUERY='
  mutation AddUser {
    addUser(id: "user1", input: {age: 22, name: "first user"}) {
      age
      id
      name
    }
  }
'
```

```
$ gq ${API_ENDPOINT} -H "Authorization:ABC" -q "${QUERY}"
```

```
Executing query... done
{
  "data": {
    "addUser": {
      "age": 22,
      "id": "user1",
      "name": "first user"
    }
  }
}
```
