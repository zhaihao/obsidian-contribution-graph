import { Editor, MarkdownFileInfo, MarkdownView, Plugin } from "obsidian";
import { ContributionGraphConfig } from "./types";
import { Renders } from "./render/renders";
import { CodeBlockProcessor } from "./processor/codeBlockProcessor";
import { ContributionGraphCreateModal } from "./view/form/GraphFormModal";
import { mountEditButtonToCodeblock } from "./view/codeblock/CodeblockEditButtonMount";
import { Locals } from "./i18/messages";
import "../style/styles.css";
import {YamlGraphConfig} from "./processor/types";

export default class ContributionGraph extends Plugin {
	async onload() {
		this.registerGlobalRenderApi();
		this.registerCodeblockProcessor();
		this.registerContributionGraphCreateCommand();
		this.registerContextMenu();
	}

	onunload() {
		// @ts-ignore
		window.renderContributionGraphByYaml = undefined;
	}

	registerContextMenu() {
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, info) => {
				menu.addItem((item) => {
					item.setTitle(Locals.get().context_menu_create);
					item.setIcon("gantt-chart");
					item.onClick(() => {
						new ContributionGraphCreateModal(this.app).open();
					});
				});
			})
		);
	}

	registerGlobalRenderApi() {//@ts-ignore
		window.renderContributionGraphByYaml = (container:HTMLElement,code:string):void => {
			const processor = new CodeBlockProcessor();
			const graphConfig: YamlGraphConfig = processor.loadYamlConfig(container, code);
			processor.renderFromYaml(graphConfig, container, this.app);
		}
	}

	registerCodeblockProcessor() {
		this.registerMarkdownCodeBlockProcessor(
			"contributionGraph",
			(code, el, ctx) => {
				const processor = new CodeBlockProcessor();
				processor.renderFromCodeBlock(code, el, ctx, this.app);
				if (el.parentElement) {
					mountEditButtonToCodeblock(
						this.app,
						code,
						el.parentElement
					);
				}
			}
		);
	}

	registerContributionGraphCreateCommand() {
		this.addCommand({
			id: "create-graph",
			name: Locals.get().context_menu_create,
			editorCallback: (
				editor: Editor,
				ctx: MarkdownView | MarkdownFileInfo
			) => {
				new ContributionGraphCreateModal(this.app).open();
			},
		});
	}
}
