import { TodosAccess } from './todosAccess'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { AttachmentUtils } from './attachmentUtils'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic

const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todoAccess.getAllTodos(userId)
}

export function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()

  return todoAccess.createTodo({
    userId: userId,
    todoId: todoId,
    createdAt: new Date().getTime().toString(),
    done: false,
    ...createTodoRequest
  })
}

export function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  todoId: string,
  userId: string
): Promise<TodoUpdate> {
  return todoAccess.updateTodo(updateTodoRequest, todoId, userId)
}

export function deleteTodo(todoId: string, userId: string): Promise<string> {
  return todoAccess.deleteTodo(todoId, userId)
}

export function createAttachmentPresignedUrl(
  todoId: string,
  userId: string
): Promise<string> {
  return attachmentUtils.generateUploadUrl(todoId, userId)
}
