/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { httpClientMock } from '../../../test/mocks';
import {
  mockDatasourcesQuery,
  mockHttpQuery,
  mockNotOkQueryResultResponse,
  mockQueryResultJDBCResponse,
  mockQueryTranslationResponse,
  mockResultWithNull,
} from '../../../test/mocks/mockData';
import Main from './main';

const setBreadcrumbsMock = jest.fn();

describe('<Main /> spec', () => {
  it('renders the component', async () => {
    const client = httpClientMock;
    client.post = jest.fn().mockResolvedValue(mockHttpQuery);
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);
    const asyncTest = () => {
      render(<Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });

  it('click run button, and response is ok', async () => {
    const client = httpClientMock;
    client.post = jest.fn().mockResolvedValue(mockQueryResultJDBCResponse);

    const { getByText } = await render(
      <Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />
    );
    const onRunButton = getByText('Run');
    const asyncTest = () => {
      fireEvent.click(onRunButton);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });

  it('click run button, response fills null and missing values', async () => {
    const client = httpClientMock;
    client.post = jest.fn().mockResolvedValue(mockResultWithNull);
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);

    const { getByText } = await render(
      <Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />
    );
    const onRunButton = getByText('Run');
    const asyncTest = () => {
      fireEvent.click(onRunButton);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });

  it('click run button, and response causes an error', async () => {
    const client = httpClientMock;
    client.post = jest.fn().mockRejectedValue('err');
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);

    const { getByText } = await render(
      <Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />
    );
    const onRunButton = getByText('Run');
    const asyncTest = () => {
      fireEvent.click(onRunButton);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });

  it('click run button, and response is not ok', async () => {
    const client = httpClientMock;
    client.post = jest.fn().mockResolvedValue(mockNotOkQueryResultResponse);
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);

    const { getByText } = await render(
      <Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />
    );
    const onRunButton = getByText('Run');
    const asyncTest = () => {
      fireEvent.click(onRunButton);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });

  it('click translation button, and response is ok', async () => {
    const client = httpClientMock;
    client.post = jest.fn().mockResolvedValue(mockQueryTranslationResponse);
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);

    const { getByText } = await render(
      <Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />
    );
    const onTranslateButton = getByText('Explain');
    const asyncTest = () => {
      fireEvent.click(onTranslateButton);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });

  it('click clear button', async () => {
    const client = httpClientMock;
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);

    const { getByText } = await render(
      <Main httpClient={client} setBreadcrumbs={setBreadcrumbsMock} />
    );
    const onClearButton = getByText('Clear');
    const asyncTest = () => {
      fireEvent.click(onClearButton);
    };
    await asyncTest();
    expect(document.body.children[0]).toMatchSnapshot();
  });
});
