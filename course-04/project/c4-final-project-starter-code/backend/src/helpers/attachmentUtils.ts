import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Types } from 'aws-sdk/clients/s3'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('AttachmentUtils')

// TODO: Implement the fileStogare logic
export class AttachmentUtils {
  constructor(
    private readonly s3Client: Types = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly s3Bucketname = process.env.ATTACHMENT_S3_BUCKET,
    private readonly signedUrlExp = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async generateUploadUrl(todoId: string, userId: string): Promise<string> {
    logger.info('Generating signed url ...')

    const url = this.s3Client.getSignedUrl('putObject', {
      Bucket: this.s3Bucketname,
      Key: todoId,
      Expires: parseInt(this.signedUrlExp)
    })

    logger.info(`Url generated, ${url}`)

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        UpdateExpression: 'set attachmentUrl=:URL',
        ExpressionAttributeValues: {
          ':URL': url.split('?')[0]
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    return url as string
  }
}
