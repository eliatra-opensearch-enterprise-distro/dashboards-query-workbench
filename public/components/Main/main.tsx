/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageSideBar,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { IHttpResponse } from 'angular';
import _ from 'lodash';
import React from 'react';
import { ChromeBreadcrumb, CoreStart } from '../../../../../src/core/public';
import { AsyncQueryLoadingStatus } from '../../../common/types';
import { MESSAGE_TAB_LABEL } from '../../utils/constants';
import {
  Tree,
  getDefaultTabId,
  getDefaultTabLabel,
  getQueries,
  getSelectedResults,
} from '../../utils/utils';
import { PPLPage } from '../PPLPage/PPLPage';
import Switch from '../QueryLanguageSwitch/Switch';
import QueryResults from '../QueryResults/QueryResults';
import { CreateButton } from '../SQLPage/CreateButton';
import { DataSelect } from '../SQLPage/DataSelect';
import { SQLPage } from '../SQLPage/SQLPage';
import { TableView } from '../SQLPage/TableView';

interface ResponseData {
  ok: boolean;
  resp: any;
  body: any;
}

export interface ResponseDetail<T> {
  fulfilled: boolean;
  errorMessage?: string;
  data?: T;
}

export type TranslateResult = { [key: string]: any };

export interface QueryMessage {
  text: any;
  className: string;
}

export type QueryResult = {
  fields: string[];
  records: DataRow[];
  message: string;
};

export interface Tab {
  id: string;
  name: string;
  disabled: boolean;
}

export type ItemIdToExpandedRowMap = {
  [key: string]: {
    nodes: Tree;
    expandedRow?: {};
    selectedNodes?: { [key: string]: any };
  };
};

export type DataRow = {
  rowId: number;
  data: { [key: string]: any };
};

interface MainProps {
  httpClient: CoreStart['http'];
  setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => void;
  isAccelerationFlyoutOpen: boolean;
  urlDataSource: string;
}

interface MainState {
  language: string;
  sqlQueriesString: string;
  pplQueriesString: string;
  queries: string[];
  queryTranslations: Array<ResponseDetail<TranslateResult>>;
  queryResultsTable: Array<ResponseDetail<QueryResult>>;
  queryResults: Array<ResponseDetail<string>>;
  queryResultsJSON: Array<ResponseDetail<string>>;
  queryResultsCSV: Array<ResponseDetail<string>>;
  queryResultsTEXT: Array<ResponseDetail<string>>;
  selectedTabName: string;
  selectedTabId: string;
  searchQuery: string;
  itemIdToExpandedRowMap: ItemIdToExpandedRowMap;
  messages: Array<QueryMessage>;
  isResultFullScreen: boolean;
  selectedDatasource: EuiComboBoxOptionOption[];
  asyncLoading: boolean;
  asyncLoadingStatus: AsyncQueryLoadingStatus;
  asyncJobId: string;
}

const SUCCESS_MESSAGE = 'Success';

const errorQueryResponse = (queryResultResponseDetail: any) => {
  let errorMessage =
    queryResultResponseDetail.errorMessage +
    ', this query is not runnable. \n \n' +
    queryResultResponseDetail.data;
  return errorMessage;
};

export function getQueryResultsForTable(
  queryResults: ResponseDetail<string>[],
  jsonParseData: boolean
): ResponseDetail<QueryResult>[] {
  return queryResults.map(
    (queryResultResponseDetail: ResponseDetail<string>): ResponseDetail<QueryResult> => {
      if (!queryResultResponseDetail.fulfilled) {
        return {
          fulfilled: queryResultResponseDetail.fulfilled,
          errorMessage: errorQueryResponse(queryResultResponseDetail),
        };
      } else {
        const resultData = jsonParseData
          ? JSON.parse(queryResultResponseDetail.data)
          : queryResultResponseDetail.data;
        const responseObj = queryResultResponseDetail.data ? resultData : '';
        let fields: string[] = [];
        let dataRows: DataRow[] = [];

        const schema: object[] = _.get(responseObj, 'schema');
        const datarows: any[][] = _.get(responseObj, 'datarows');
        let queryType = 'default';

        for (const column of schema.values()) {
          if (_.isEqual(_.get(column, 'name'), 'TABLE_NAME')) {
            queryType = 'show';
            for (const col of schema.values()) {
              if (_.isEqual(_.get(col, 'name'), 'DATA_TYPE')) queryType = 'describe';
            }
          }
        }

        switch (queryType) {
          case 'show':
            fields[0] = 'TABLE_NAME';

            let index: number = -1;
            for (const [id, field] of schema.entries()) {
              if (_.eq(_.get(field, 'name'), 'TABLE_NAME')) {
                index = id;
                break;
              }
            }

            for (const [id, field] of datarows.entries()) {
              let row: { [key: string]: any } = {};
              row['TABLE_NAME'] = field[index];
              let dataRow: DataRow = {
                rowId: id,
                data: row,
              };
              dataRows[id] = dataRow;
            }
            break;

          case 'describe':
          case 'default':
            for (const [id, field] of schema.entries()) {
              let alias: any = null;
              try {
                alias = _.get(field, 'alias');
              } catch (e) {
                console.log('No alias for field ' + field);
              } finally {
                fields[id] = !alias ? _.get(field, 'name') : alias;
              }
            }

            for (const [id, data] of datarows.entries()) {
              let row: { [key: string]: any } = {};
              for (const index of schema.keys()) {
                const fieldname = fields[index];
                row[fieldname] = _.isNull(data[index]) ? '-' : data[index];
              }
              let dataRow: DataRow = {
                rowId: id,
                data: row,
              };
              dataRows[id] = dataRow;
            }
            break;

          default:
        }
        return {
          fulfilled: queryResultResponseDetail.fulfilled,
          data: {
            fields: fields,
            records: dataRows,
            message: SUCCESS_MESSAGE,
          },
        };
      }
    }
  );
}

export class Main extends React.Component<MainProps, MainState> {
  httpClient: CoreStart['http'];

  constructor(props: MainProps) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.state = {
      language: 'SQL',
      sqlQueriesString: "SHOW tables LIKE '%';",
      pplQueriesString: '',
      queries: [],
      queryTranslations: [],
      queryResultsTable: [],
      queryResults: [],
      queryResultsJSON: [],
      queryResultsCSV: [],
      queryResultsTEXT: [],
      selectedTabName: MESSAGE_TAB_LABEL,
      selectedTabId: MESSAGE_TAB_LABEL,
      searchQuery: '',
      itemIdToExpandedRowMap: {},
      messages: [],
      isResultFullScreen: false,
      selectedDatasource: [{ label: 'OpenSearch' }],
      asyncLoading: false,
      asyncLoadingStatus: 'SUCCESS',
      asyncJobId: '',
    };
    this.httpClient = this.props.httpClient;
    this.updateSQLQueries = _.debounce(this.updateSQLQueries, 250).bind(this);
    this.updatePPLQueries = _.debounce(this.updatePPLQueries, 250).bind(this);
    this.setIsResultFullScreen = this.setIsResultFullScreen.bind(this);
  }

  componentDidMount() {
    this.props.setBreadcrumbs([
      {
        text: 'Query Workbench',
        href: '#',
      },
    ]);
  }

  processTranslateResponse(response: IHttpResponse<ResponseData>): ResponseDetail<TranslateResult> {
    if (!response) {
      return {
        fulfilled: false,
        errorMessage: 'no response',
        data: undefined,
      };
    }
    if (!response.data.ok) {
      return {
        fulfilled: false,
        errorMessage: response.data.resp,
        data: undefined,
      };
    }
    return {
      fulfilled: true,
      data: response.data.resp,
    };
  }

  processQueryResponse(response: IHttpResponse<ResponseData>): ResponseDetail<string> {
    if (!response) {
      return {
        fulfilled: false,
        errorMessage: 'no response',
        data: '',
      };
    }
    if (!response.data.ok) {
      let err = response.data.resp;
      console.log('Error occurred when processing query response: ', err);

      // Exclude a special case from the error cases:
      // When downloading the csv result, it gets the "Unable to parse/serialize body" response
      // But data is also returned in data body. For this case:
      // Mark fulfilled to true for this case to write the csv result to downloading file
      if (response.data.body && err == 'Unable to parse/serialize body') {
        return {
          fulfilled: true,
          errorMessage: err,
          data: response.data.body,
        };
      }
      return {
        fulfilled: false,
        errorMessage: err,
        data: '',
      };
    }

    return {
      fulfilled: true,
      data: response.data.resp,
    };
  }

  onSelectedTabIdChange = (tab: Tab): void => {
    this.setState({
      selectedTabId: tab.id,
      selectedTabName: tab.name,
      searchQuery: '',
      itemIdToExpandedRowMap: {},
    });
  };

  onQueryChange = ({ query }: { query: any }) => {
    // Reset pagination state.
    this.setState({
      searchQuery: query,
      itemIdToExpandedRowMap: {},
    });
  };

  updateExpandedMap = (map: ItemIdToExpandedRowMap): void => {
    this.setState({ itemIdToExpandedRowMap: map });
  };

  // It returns the error or successful message to display in the Message Tab
  getMessage(queryResultsForTable: ResponseDetail<QueryResult>[]): Array<QueryMessage> {
    return queryResultsForTable.map((queryResult) => {
      return {
        text:
          queryResult.fulfilled && queryResult.data
            ? queryResult.data.message
            : queryResult.errorMessage,
        className: queryResult.fulfilled ? 'successful-message' : 'error-message',
      };
    });
  }

  getTranslateMessage(translationResult: ResponseDetail<TranslateResult>[]): Array<QueryMessage> {
    return translationResult.map((translation) => {
      return {
        text: translation.data ? SUCCESS_MESSAGE : translation.errorMessage,
        className: translation.fulfilled ? 'successful-message' : 'error-message',
      };
    });
  }

  onRun = (queriesString: string): void => {
    const queries: string[] = getQueries(queriesString);
    const language = this.state.language;
    if (queries.length > 0) {
      let endpoint = '/api/sql_console/' + (_.isEqual(language, 'SQL') ? 'sqlquery' : 'pplquery');
      const responsePromise = Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post(endpoint, { body: JSON.stringify({ query }) })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      );
      Promise.all([responsePromise]).then(([response]) => {
        const results: ResponseDetail<string>[] = response.map((response) =>
          this.processQueryResponse(response as IHttpResponse<ResponseData>)
        );
        const resultTable: ResponseDetail<QueryResult>[] = getQueryResultsForTable(results, true);
        this.setState(
          {
            queries: queries,
            queryResults: results,
            queryResultsTable: resultTable,
            selectedTabId: getDefaultTabId(results),
            selectedTabName: getDefaultTabLabel(results, queries[0]),
            messages: this.getMessage(resultTable),
            itemIdToExpandedRowMap: {},
            queryResultsJSON: [],
            queryResultsCSV: [],
            queryResultsTEXT: [],
            searchQuery: '',
          },
          () => console.log('Successfully updated the states')
        ); // added callback function to handle async issues
      });
    }
  };

  onRunAsync = (queriesString: string): void => {
    // switch to an async query here if using any datasource != Opensearch

    // finding regular query here
    const queries: string[] = getQueries(queriesString);
    const language = this.state.language;
    if (queries.length > 0) {
      let endpoint = '/api/spark_sql_console';
      const responsePromise = Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post(endpoint, {
              body: JSON.stringify({
                lang: language,
                query: query,
                datasource: this.state.selectedDatasource[0].label,
              }),
            })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      );

      Promise.all([responsePromise]).then(([response]) => {
        const results: ResponseDetail<string>[] = response.map((response) =>
          this.processQueryResponse(response as IHttpResponse<ResponseData>)
        );
        results.map(
          (queryResultResponseDetail: ResponseDetail<string>): ResponseDetail<QueryResult> => {
            if (!queryResultResponseDetail.fulfilled) {
              return {
                fulfilled: queryResultResponseDetail.fulfilled,
                errorMessage: errorQueryResponse(queryResultResponseDetail),
              };
            } else {
              const responseObj = queryResultResponseDetail.data
                ? queryResultResponseDetail.data
                : '';

              const queryId: string = _.get(responseObj, 'queryId');

              // clear state from previous results and start async loading
              this.setState({
                queryTranslations: [],
                queryResultsTable: [],
                queryResults: [],
                queryResultsCSV: [],
                queryResultsJSON: [],
                queryResultsTEXT: [],
                messages: [],
                selectedTabId: MESSAGE_TAB_LABEL,
                selectedTabName: MESSAGE_TAB_LABEL,
                itemIdToExpandedRowMap: {},
                asyncLoading: true,
                asyncLoadingStatus: 'SCHEDULED',
                asyncJobId: queryId,
              });
              this.callGetStartPolling(queries);
              const interval = setInterval(() => {
                if (!this.state.asyncLoading) {
                  clearInterval(interval);
                }
                this.callGetStartPolling(queries);
              }, 2 * 1000);
            }
          }
        );
      });
    }
  };

  callGetStartPolling = async (queries: string[]) => {
    const nextP = this.httpClient
      .get('/api/spark_sql_console/job/' + this.state.asyncJobId)
      .catch((error: any) => {
        this.setState({
          messages: [
            {
              text: error.message,
              className: 'error-message',
            },
          ],
        });
      });

    return await nextP.then((response) => {
      const result: ResponseDetail<string> = this.processQueryResponse(
        response as IHttpResponse<ResponseData>
      );
      const status = result.data['status'];
      if (_.isEqual(status, 'SUCCESS')) {
        const resultTable: ResponseDetail<QueryResult>[] = getQueryResultsForTable([result], false);
        this.setState({
          queries: queries,
          queryResults: [result],
          queryResultsTable: resultTable,
          selectedTabId: getDefaultTabId([result]),
          selectedTabName: getDefaultTabLabel([result], queries[0]),
          messages: this.getMessage(resultTable),
          itemIdToExpandedRowMap: {},
          queryResultsJSON: [],
          queryResultsCSV: [],
          queryResultsTEXT: [],
          searchQuery: '',
          asyncLoading: false,
          asyncLoadingStatus: status,
        });
      } else if (_.isEqual(status, 'FAILED') || _.isEqual(status, 'CANCELLED')) {
        this.setState({
          asyncLoading: false,
          asyncLoadingStatus: status,
          messages: [
            {
              text: status,
              className: 'error-message',
            },
          ],
        });
      } else {
        this.setState({
          asyncLoading: true,
          asyncLoadingStatus: status,
        });
      }
    });
  };

  cancelAsyncQuery = async () => {
    Promise.all([
      this.httpClient
        .delete('/api/spark_sql_console/job/' + this.state.asyncJobId)
        .catch((error: any) => {
          this.setState({
            messages: [
              {
                text: error.message,
                className: 'error-message',
              },
            ],
          });
        }),
    ]);
  };

  onTranslate = (queriesString: string): void => {
    const queries: string[] = getQueries(queriesString);
    const language = this.state.language;

    if (queries.length > 0) {
      let endpoint =
        '/api/sql_console/' + (_.isEqual(language, 'SQL') ? 'translatesql' : 'translateppl');
      const translationPromise = Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post(endpoint, { body: JSON.stringify({ query: query }) })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      );

      Promise.all([translationPromise]).then(([translationResponse]) => {
        const translationResult: ResponseDetail<
          TranslateResult
        >[] = translationResponse.map((translationResponse) =>
          this.processTranslateResponse(translationResponse as IHttpResponse<ResponseData>)
        );
        const shouldCleanResults = queries == this.state.queries;
        if (shouldCleanResults) {
          this.setState({
            queries,
            queryTranslations: translationResult,
            messages: this.getTranslateMessage(translationResult),
          });
        } else {
          this.setState(
            {
              queries,
              queryTranslations: translationResult,
              messages: this.getTranslateMessage(translationResult),
            },
            () => console.log('Successfully updated the states')
          );
        }
      });
    }
  };

  getJson = (queries: string[]): void => {
    if (queries.length > 0) {
      Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post('/api/sql_console/sqljson', { body: JSON.stringify({ query }) })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      ).then((response) => {
        const results: ResponseDetail<string>[] = response.map((response) =>
          this.processQueryResponse(response as IHttpResponse<ResponseData>)
        );
        this.setState(
          {
            queries,
            queryResultsJSON: results,
          },
          () => console.log('Successfully updated the states')
        );
      });
    }
  };

  getJdbc = (queries: string[]): void => {
    const language = this.state.language;
    if (queries.length > 0) {
      let endpoint = '/api/sql_console/' + (_.isEqual(language, 'SQL') ? 'sqlquery' : 'pplquery');
      Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post(endpoint, { body: JSON.stringify({ query: query }) })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      ).then((jdbcResponse) => {
        const jdbcResult: ResponseDetail<string>[] = jdbcResponse.map((jdbcResponse) =>
          this.processQueryResponse(jdbcResponse as IHttpResponse<ResponseData>)
        );
        this.setState(
          {
            queries,
            queryResults: jdbcResult,
          },
          () => console.log('Successfully updated the states')
        );
      });
    }
  };

  getCsv = (queries: string[]): void => {
    const language = this.state.language;
    if (queries.length > 0) {
      let endpoint = '/api/sql_console/' + (_.isEqual(language, 'SQL') ? 'sqlcsv' : 'pplcsv');
      Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post(endpoint, { body: JSON.stringify({ query: query }) })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      ).then((csvResponse) => {
        const csvResult: ResponseDetail<string>[] = csvResponse.map((csvResponse) =>
          this.processQueryResponse(csvResponse as IHttpResponse<ResponseData>)
        );
        this.setState(
          {
            queries,
            queryResultsCSV: csvResult,
          },
          () => console.log('Successfully updated the states')
        );
      });
    }
  };

  getText = (queries: string[]): void => {
    const language = this.state.language;
    if (queries.length > 0) {
      let endpoint = '/api/sql_console/' + (_.isEqual(language, 'SQL') ? 'sqltext' : 'ppltext');
      Promise.all(
        queries.map((query: string) =>
          this.httpClient
            .post(endpoint, { body: JSON.stringify({ query: query }) })
            .catch((error: any) => {
              this.setState({
                messages: [
                  {
                    text: error.message,
                    className: 'error-message',
                  },
                ],
              });
            })
        )
      ).then((textResponse) => {
        const textResult: ResponseDetail<string>[] = textResponse.map((textResponse) =>
          this.processQueryResponse(textResponse as IHttpResponse<ResponseData>)
        );
        this.setState(
          {
            queries,
            queryResultsTEXT: textResult,
          },
          () => console.log('Successfully updated the states')
        );
      });
    }
  };

  onClear = (): void => {
    this.setState({
      queries: [],
      queryTranslations: [],
      queryResultsTable: [],
      queryResults: [],
      queryResultsCSV: [],
      queryResultsJSON: [],
      queryResultsTEXT: [],
      messages: [],
      selectedTabId: MESSAGE_TAB_LABEL,
      selectedTabName: MESSAGE_TAB_LABEL,
      itemIdToExpandedRowMap: {},
    });
  };

  onChange = (id: string) => {
    this.setState(
      {
        language: id,
        queryResultsTable: [],
      },
      () => console.log('Successfully updated language to ', this.state.language)
    ); // added callback function to handle async issues
  };

  updateSQLQueries = (query: string) => {
    this.setState({
      sqlQueriesString: query,
    });
  };

  updatePPLQueries(query: string) {
    this.setState({
      pplQueriesString: query,
    });
  }

  setIsResultFullScreen(isFullScreen: boolean) {
    this.setState({
      isResultFullScreen: isFullScreen,
    });
  }

  handleDataSelect = (selectedItems: []) => {
    if (selectedItems[0].label !== 'OpenSearch' && this.state.language === 'SQL') {
      this.updateSQLQueries('');
    }
    this.setState({
      selectedDatasource: selectedItems,
    });
  };

  render() {
    let page;
    let link;
    let linkTitle;

    if (this.state.language == 'SQL') {
      page = (
        <SQLPage
          http={this.httpClient}
          onRun={
            _.isEqual(this.state.selectedDatasource[0].label, 'OpenSearch')
              ? this.onRun
              : this.onRunAsync
          }
          onTranslate={this.onTranslate}
          onClear={this.onClear}
          sqlQuery={this.state.sqlQueriesString}
          sqlTranslations={this.state.queryTranslations}
          updateSQLQueries={this.updateSQLQueries}
          selectedDatasource={this.state.selectedDatasource}
          asyncLoading={this.state.asyncLoading}
        />
      );
      link = 'https://opensearch.org/docs/latest/search-plugins/sql/index/';
      linkTitle = 'SQL documentation';
    } else {
      page = (
        <PPLPage
          onRun={
            _.isEqual(this.state.selectedDatasource[0].label, 'OpenSearch')
              ? this.onRun
              : this.onRunAsync
          }
          onTranslate={this.onTranslate}
          onClear={this.onClear}
          pplQuery={this.state.pplQueriesString}
          pplTranslations={this.state.queryTranslations}
          updatePPLQueries={this.updatePPLQueries}
          asyncLoading={this.state.asyncLoading}
        />
      );
      link = 'https://opensearch.org/docs/latest/observability-plugin/ppl/index/';
      linkTitle = 'PPL documentation';
    }

    if (this.state.isResultFullScreen) {
      return (
        <div className="sql-console-query-result">
          <QueryResults
            language={this.state.language}
            queries={this.state.queries}
            queryResults={this.state.queryResultsTable}
            queryResultsJDBC={getSelectedResults(this.state.queryResults, this.state.selectedTabId)}
            queryResultsJSON={getSelectedResults(
              this.state.queryResultsJSON,
              this.state.selectedTabId
            )}
            queryResultsCSV={getSelectedResults(
              this.state.queryResultsCSV,
              this.state.selectedTabId
            )}
            queryResultsTEXT={getSelectedResults(
              this.state.queryResultsTEXT,
              this.state.selectedTabId
            )}
            messages={this.state.messages}
            selectedTabId={this.state.selectedTabId}
            selectedTabName={this.state.selectedTabName}
            onSelectedTabIdChange={this.onSelectedTabIdChange}
            itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
            onQueryChange={this.onQueryChange}
            updateExpandedMap={this.updateExpandedMap}
            searchQuery={this.state.searchQuery}
            tabsOverflow={false}
            getJson={this.getJson}
            getJdbc={this.getJdbc}
            getCsv={this.getCsv}
            getText={this.getText}
            isResultFullScreen={this.state.isResultFullScreen}
            setIsResultFullScreen={this.setIsResultFullScreen}
            asyncLoading={this.state.asyncLoading}
            asyncLoadingStatus={this.state.asyncLoadingStatus}
            cancelAsyncQuery={this.cancelAsyncQuery}
            selectedDatasource={this.state.selectedDatasource}
          />
        </div>
      );
    }

    return (
      <>
        <EuiFlexGroup direction="row" alignItems="center">
          <EuiFlexItem>
            <EuiText>Data Sources</EuiText>
            <DataSelect
              http={this.httpClient}
              onSelect={this.handleDataSelect}
              urlDataSource={this.props.urlDataSource}
              asyncLoading={this.state.asyncLoading}
            />
            <EuiSpacer />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <Switch
              onChange={this.onChange}
              language={this.state.language}
              asyncLoading={this.state.asyncLoading}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton href={link} target="_blank" iconType="popout" iconSide="right">
              {linkTitle}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiPage paddingSize="none">
          {this.state.language === 'SQL' && (
            <EuiPanel>
              <EuiPageSideBar style={{ maxWidth: '400px', width: '400px' }}>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <CreateButton
                        updateSQLQueries={this.updateSQLQueries}
                        selectedDatasource={this.state.selectedDatasource}
                      />
                    </EuiFlexItem>
                    <EuiSpacer />
                    <TableView
                      http={this.httpClient}
                      selectedItems={this.state.selectedDatasource}
                      updateSQLQueries={this.updateSQLQueries}
                    />
                    <EuiSpacer />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageSideBar>
            </EuiPanel>
          )}

          <EuiPageContent paddingSize="m">
            <EuiPageContentBody>
              <EuiFlexGroup alignItems="center"></EuiFlexGroup>
              <EuiSpacer size="l" />
              <div>{page}</div>
              <EuiSpacer size="l" />
              <div className="sql-console-query-result">
                <QueryResults
                  language={this.state.language}
                  queries={this.state.queries}
                  queryResults={this.state.queryResultsTable}
                  queryResultsJDBC={getSelectedResults(
                    this.state.queryResults,
                    this.state.selectedTabId
                  )}
                  queryResultsJSON={getSelectedResults(
                    this.state.queryResultsJSON,
                    this.state.selectedTabId
                  )}
                  queryResultsCSV={getSelectedResults(
                    this.state.queryResultsCSV,
                    this.state.selectedTabId
                  )}
                  queryResultsTEXT={getSelectedResults(
                    this.state.queryResultsTEXT,
                    this.state.selectedTabId
                  )}
                  messages={this.state.messages}
                  selectedTabId={this.state.selectedTabId}
                  selectedTabName={this.state.selectedTabName}
                  onSelectedTabIdChange={this.onSelectedTabIdChange}
                  itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
                  onQueryChange={this.onQueryChange}
                  updateExpandedMap={this.updateExpandedMap}
                  searchQuery={this.state.searchQuery}
                  tabsOverflow={false}
                  getJson={this.getJson}
                  getJdbc={this.getJdbc}
                  getCsv={this.getCsv}
                  getText={this.getText}
                  isResultFullScreen={this.state.isResultFullScreen}
                  setIsResultFullScreen={this.setIsResultFullScreen}
                  asyncLoading={this.state.asyncLoading}
                  asyncLoadingStatus={this.state.asyncLoadingStatus}
                  cancelAsyncQuery={this.cancelAsyncQuery}
                  selectedDatasource={this.state.selectedDatasource}
                />
              </div>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPage>
      </>
    );
  }
}

export default Main;
