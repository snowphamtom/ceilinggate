export type Id<TableName extends string> = string & { __tableName: TableName };
export type Doc<_TableName extends string> = Record<string, unknown> & {
  _id: Id<_TableName>;
  _creationTime: number;
};
export type DataModel = any;
