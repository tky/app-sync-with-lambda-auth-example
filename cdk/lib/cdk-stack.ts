import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import {
  AuthorizationType,
  Directive,
  GraphqlApi,
  Field,
  GraphqlType,
  InputType,
  MappingTemplate,
  ObjectType,
  PrimaryKey,
  Values,
  ResolvableField,
  Schema,
} from "@aws-cdk/aws-appsync-alpha";
import { RemovalPolicy } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // subscription使うためにはschemaをcodeで定義しなければならない
    const typeUser = new ObjectType("User", {
      definition: {
        id: GraphqlType.string({ isRequired: true }),
        name: GraphqlType.string({ isRequired: true }),
        age: GraphqlType.int({ isRequired: false }),
      },
    });

    const typeUserInput = new InputType("UserInput", {
      definition: {
        name: GraphqlType.string({ isRequired: true }),
        age: GraphqlType.int({ isRequired: false }),
      },
    });

    const schema = new Schema();
    schema.addType(typeUser);
    schema.addType(typeUserInput);

    // NodejsFunction使うためには
    // {このtypescriptのファイル名}.{NodejsFunctionのid}.ts
    // というファイル名で保存しなければならない
    // 今回は
    // cdk-stack.tsというファイルでhandlerというidにしているので
    // cdk-stack.handler.tsになる
    const handler = new NodejsFunction(this, "handler", {
      functionName: "app-sync-with-lambda-auth-hander",
    });

    const api = new GraphqlApi(this, "api", {
      name: "app-sync-with-lambda-auth-example-api",
      schema,
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.LAMBDA,
          lambdaAuthorizerConfig: {
            handler,
            resultsCacheTtl: Duration.seconds(1),
          },
        },
      },
      xrayEnabled: false,
    });

    const table = new Table(this, "table", {
      tableName: "app-sync-with-lambda-auth-example-table",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const dataSource = api.addDynamoDbDataSource("data_source", table);

    schema.addQuery(
      "getUser",
      new ResolvableField({
        returnType: typeUser.attribute(),
        args: {
          id: GraphqlType.id({ isRequired: true }),
        },
        dataSource,
        requestMappingTemplate: MappingTemplate.dynamoDbGetItem("id", "id"),
        responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
      })
    );

    schema.addMutation(
      "addUser",
      new ResolvableField({
        returnType: typeUser.attribute(),
        args: {
          id: GraphqlType.string({ isRequired: true }),
          input: typeUserInput.attribute({ isRequired: true }),
        },
        dataSource,
        requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
          PrimaryKey.partition("id").is("id"),
          Values.projecting("input")
        ),
        responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
      })
    );

    schema.addSubscription(
      "updatedUser",
      new Field({
        returnType: typeUser.attribute(),
        args: { id: GraphqlType.id({ isRequired: true }) },
        directives: [Directive.subscribe("addUser")],
      })
    );
  }
}
