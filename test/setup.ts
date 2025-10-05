
process.env.DYNAMODB_TABLE = 'test-appointments-table';
process.env.SNS_TOPIC_PE_ARN = 'arn:aws:sns:us-east-1:123456789:test-topic-pe';
process.env.SNS_TOPIC_CL_ARN = 'arn:aws:sns:us-east-1:123456789:test-topic-cl';
process.env.SQS_CONFIRMATION_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/test-confirmation';
process.env.EVENT_BRIDGE_NAME = 'test-event-bridge';
process.env.RDS_HOST = 'localhost';
process.env.RDS_PORT = '3306';
process.env.RDS_DATABASE = 'test_appointments';
process.env.RDS_USER = 'test_user';
process.env.RDS_PASSWORD = 'test_password';
process.env.AWS_REGION = 'us-east-1';