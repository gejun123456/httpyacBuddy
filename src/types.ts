export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ParameterKind = 'path' | 'query' | 'header' | 'body';

export interface ParameterInfo {
  name: string;
  javaType: string;
  required: boolean;
  defaultValue?: string;
  kind: ParameterKind;
  expandObject?: boolean;
}

export interface MethodInfo {
  name: string;
  annotationLine: number;
  httpMethod: HttpMethod;
  pathSuffix: string;
  pathVariables: ParameterInfo[];
  queryParams: ParameterInfo[];
  headers: ParameterInfo[];
  requestBody?: ParameterInfo;
}

export interface ControllerInfo {
  className: string;
  classLine: number;
  basePath: string;
  imports: Record<string, string>;
  filePath: string;
  methods: MethodInfo[];
}

export interface CodeLensArgs {
  controller: ControllerInfo;
  method: MethodInfo;
}
