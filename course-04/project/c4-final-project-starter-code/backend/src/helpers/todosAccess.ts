import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodoAccess')

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos for user ...')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: '#userId = :userId',
        ExpressionAttributeNames: {
          '#userId': 'userId'
        },
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: true
      })
      .promise()

    logger.info('All todos for this user queried', result)
    const items = result.Items

    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating todo item ...')

    const result = await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    logger.info(`Todo item created, ${result}`)

    return todoItem as TodoItem
  }

  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    logger.info('Getting a todo')

    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          todoId: todoId
        }
      })
      .promise()

    if (!result.Item) {
      throw new Error(
        'Requested Todo does not exist or might have been deleted.'
      )
    }

    return result.Item as TodoItem
  }

  async updateTodo(
    todoUpdate: TodoUpdate,
    todoId: string,
    userId: string
  ): Promise<TodoUpdate> {
    logger.info(`Updating todo item with id , ${todoId}`)

    const result = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        UpdateExpression:
          'set #name = :name, #duedate = :duedate, #done = :done',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#duedate': 'duedate',
          '#done': 'done'
        },
        ExpressionAttributeValues: {
          ':name': todoUpdate['name'],
          ':duedate': todoUpdate['dueDate'],
          ':done': todoUpdate['done']
        },
        ReturnValues: 'ALL_NEW'
      })
      .promise()

    logger.info(`Todo item updated, ${result}`)

    const attributes = result.Attributes

    return attributes as TodoUpdate
  }

  async deleteTodo(todoId: string, userId: string): Promise<string> {
    logger.info('Deleting todo item ...')

    const result = await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          todoId: todoId
        }
      })
      .promise()

    logger.info(`Todo item deleted, ${result}`)

    return '' as string
  }
}
