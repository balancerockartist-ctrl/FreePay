import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";

jest.mock("axios");

// Mock react-router-dom to avoid Jest 27 / package-exports incompatibility
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }) => React.createElement(React.Fragment, null, children),
    Route: ({ element }) => element,
  };
});

import App from "./App";

describe("App component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    axios.get.mockResolvedValue({ data: { message: "Hello World" } });
    render(<App />);
  });

  it("renders the App-header element", () => {
    axios.get.mockResolvedValue({ data: { message: "Hello World" } });
    render(<App />);
    expect(document.querySelector(".App-header")).toBeInTheDocument();
  });

  it("renders the tagline text", () => {
    axios.get.mockResolvedValue({ data: { message: "Hello World" } });
    render(<App />);
    expect(screen.getByText(/Building something incredible/i)).toBeInTheDocument();
  });

  it("renders the emergent.sh link", () => {
    axios.get.mockResolvedValue({ data: { message: "Hello World" } });
    render(<App />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://emergent.sh");
  });

  it("calls the API on mount", async () => {
    axios.get.mockResolvedValue({ data: { message: "Hello World" } });
    render(<App />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/api/"));
  });

  it("logs the api message on success", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockResolvedValue({ data: { message: "Hello World" } });
    render(<App />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Hello World");
    });
    consoleSpy.mockRestore();
  });

  it("logs an error when the API call fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Network Error");
    axios.get.mockRejectedValue(error);
    render(<App />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        error,
        "errored out requesting / api"
      );
    });
    consoleSpy.mockRestore();
  });
});
