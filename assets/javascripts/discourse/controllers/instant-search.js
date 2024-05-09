import { tracked } from "@glimmer/tracking";
import Controller from "@ember/controller";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import loadInstantSearch from "discourse/lib/load-instant-search";

export default class InstantSearch extends Controller {
  @service siteSettings;
  @tracked instantSearchModule;
  @tracked searchType = this.searchTypes[0].value;
  @tracked query = "";
  @tracked embeddings = [];
  @tracked searchMode = "keyword";
  @tracked apiKey = this.model.api_key;
  @tracked categoryWeights = this.model.categories;

  constructor() {
    super(...arguments);
    this.loadInstantSearch();
  }

  get searchTypes() {
    return [
      {
        label: "Posts",
        value: "posts",
      },
      {
        label: "Topics",
        value: "topics",
      },
      {
        label: "Chat Messages",
        value: "chat_messages",
      },
      {
        label: "Users",
        value: "users",
      },
    ];
  }

  get searchModes() {
    return [
      {
        label: "Keyword Search",
        value: "keyword",
      },
      {
        label: "Semantic Search",
        value: "semantic",
      },
      {
        label: "Hybrid Search",
        value: "hybrid",
      },
      {
        label: "Hyde Search",
        value: "hyde",
      },
    ];
  }

  get apiData() {
    let indexes = this.searchParameters;

    if (!this.siteSettings.proxy_typesense_requests) {
      const typesenseNodes = JSON.parse(this.siteSettings.typesense_nodes);

      return {
        apiKey: this.apiKey,
        port: typesenseNodes[0].port,
        host: typesenseNodes[0].host,
        protocol: typesenseNodes[0].protocol,
        indexName: this.searchType,
        queryBy: this.searchParameters[this.searchType].query_by,
      };
    } else {
      return {
        apiKey: this.apiKey,
        path: "/typesense",
        port: window.location.port || 443,
        host: window.location.hostname,
        protocol: window.location.protocol.replace(":", ""),
        indexName: this.searchType,
        queryBy: indexes[this.searchType].query_by,
      };
    }
  }

  get searchParameters() {
    return {
      posts: {
        query_by: "topic_title,raw",
        query_by_weights: "2,1",
        exclude_fields: "embeddings",
        facet_by: "author_username,category,tags,type",
        sort_by: `_text_match(buckets: 20):desc,${this.categoryWeights}`,
      },
      topics: {
        query_by: "title,blurb",
        exclude_fields: "embeddings",
        facet_by: "author_username,category,tags,type",
        sort_by: `_text_match(buckets: 10):desc,${this.categoryWeights}`,
      },
      users: {
        query_by: "username,name",
        facet_by: "trust_level,groups",
        sort_by: "_text_match:desc,trust_level:desc,likes_received:desc",
      },
      chat_messages: {
        query_by: "raw",
        facet_by: "author_username,channel_name",
      },
    };
  }

  async loadInstantSearch() {
    this.instantSearchModule = await loadInstantSearch();
  }

  get instantSearch() {
    return this.instantSearchModule;
  }

  @action
  async updateQuery(newQuery) {
    this.query = newQuery;
  }
}
