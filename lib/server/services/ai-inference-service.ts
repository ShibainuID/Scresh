type AiInferenceConfig = {
  baseUrl: string;
  token: string;
  timeoutMs: number;
};

type ScanInput = {
  commodity: string;
  image: File;
};

type Environment = Record<string, string | undefined>;
type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class AiInferenceError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AiInferenceError";
  }
}

export class AiInferenceService {
  constructor(
    private readonly config: AiInferenceConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  static fromEnvironment(
    environment: Environment = process.env,
  ): AiInferenceService {
    const baseUrl = environment.AI_SERVICE_URL?.trim();
    const token = environment.AI_SERVICE_TOKEN?.trim();

    if (!baseUrl || !token) {
      throw new Error("AI service is not configured");
    }

    const configuredTimeout = Number(environment.AI_SERVICE_TIMEOUT_MS);
    const timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 120_000;

    return new AiInferenceService({ baseUrl, token, timeoutMs });
  }

  async scan(input: ScanInput): Promise<unknown> {
    const body = new FormData();
    body.set("commodity", input.commodity);
    body.set("image", input.image);

    let response: Response;
    try {
      response = await this.fetcher(
        `${this.config.baseUrl.replace(/\/+$/, "")}/infer/freshness`,
        {
          method: "POST",
          headers: {
            "X-AI-Service-Token": this.config.token,
          },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );
    } catch {
      throw new AiInferenceError(503, "AI service is unavailable");
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail =
        payload &&
        typeof payload === "object" &&
        "detail" in payload &&
        typeof payload.detail === "string"
          ? payload.detail
          : "AI service request failed";
      throw new AiInferenceError(response.status, detail);
    }

    return payload;
  }
}
